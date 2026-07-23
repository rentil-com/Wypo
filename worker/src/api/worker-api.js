import crypto from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import {
  loadWorkerSettings,
  settingsToEntries,
  updateWorkerSettings,
  WorkerSettingsValidationError
} from "../services/worker-settings.js";

const MAX_JSON_BODY_BYTES = 16 * 1024;

class ApiRequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest();
}

function hasValidApiKey(request, expectedApiKey) {
  const authorization = request.get("authorization");

  if (typeof authorization !== "string") {
    return false;
  }

  const match = authorization.match(/^Bearer\s+(\S+)\s*$/i);

  if (!match) {
    return false;
  }

  return crypto.timingSafeEqual(hash(match[1]), hash(expectedApiKey));
}

function serializeSettings(settings) {
  return Object.fromEntries(settingsToEntries(settings));
}

function serializePromotion(result) {
  return {
    promotion_id: result.backendPromotionId,
    item_id: result.item.id,
    item_name: result.item.nazwa ?? null,
    old_price: result.oldPrice,
    discount_percent: result.discountPercent,
    promotional_price: result.promotionalPrice
  };
}

function requireApiKey(expectedApiKey) {
  return (request, response, next) => {
    if (hasValidApiKey(request, expectedApiKey)) {
      next();
      return;
    }

    response
      .set("WWW-Authenticate", "Bearer")
      .status(401)
      .json({ error: "Brak lub nieprawidlowy klucz API." });
  };
}

function requireJsonContentType(request, _response, next) {
  if (!request.is("application/json")) {
    next(
      new ApiRequestError(
        415,
        "Naglowek Content-Type musi miec wartosc application/json."
      )
    );
    return;
  }

  next();
}

function mapRequestError(error) {
  if (
    error instanceof ApiRequestError ||
    error instanceof WorkerSettingsValidationError
  ) {
    return {
      statusCode: error.statusCode ?? 400,
      message: error.message
    };
  }

  if (error?.type === "entity.too.large") {
    return {
      statusCode: 413,
      message: `Body JSON nie moze przekraczac ${MAX_JSON_BODY_BYTES} bajtow.`
    };
  }

  if (error?.type === "entity.parse.failed") {
    return {
      statusCode: 400,
      message: "Body nie zawiera poprawnego JSON."
    };
  }

  return null;
}

export function createWorkerApiApp({
  repository,
  apiKey,
  runPromotion,
  onSettingsUpdated = async () => {},
  logger = console
}) {
  let updateQueue = Promise.resolve();
  const app = express();
  const authenticate = requireApiKey(apiKey);

  const enqueueUpdate = (operation) => {
    const result = updateQueue.then(operation, operation);
    updateQueue = result.catch(() => {});
    return result;
  };

  app.disable("x-powered-by");
  app.set("json escape", true);
  app.use((_request, response, next) => {
    response.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    next();
  });

  app.get("/settings", authenticate, async (_request, response, next) => {
    try {
      const settings = await loadWorkerSettings(repository);
      response.status(200).json({
        settings: serializeSettings(settings)
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch(
    "/settings",
    authenticate,
    requireJsonContentType,
    express.json({ limit: MAX_JSON_BODY_BYTES, strict: true }),
    async (request, response, next) => {
      try {
        if (request.body === undefined) {
          throw new ApiRequestError(400, "Body JSON nie moze byc puste.");
        }

        const settings = await enqueueUpdate(async () => {
          const updatedSettings = await updateWorkerSettings(
            repository,
            request.body
          );

          await onSettingsUpdated(updatedSettings);
          return updatedSettings;
        });

        response.status(200).json({
          message: "Zaktualizowano ustawienia workera.",
          settings: serializeSettings(settings)
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/runpromotion", authenticate, async (_request, response, next) => {
    try {
      const outcome = await runPromotion();

      if (outcome.status === "already_running") {
        response.status(409).json({
          error: "Promocja jest juz wykonywana.",
          status: outcome.status
        });
        return;
      }

      if (outcome.status === "skipped") {
        response.status(200).json({
          message:
            "Wykonano zadanie, ale nie znaleziono przedmiotu do promocji.",
          status: outcome.status,
          promotion: null
        });
        return;
      }

      if (outcome.status !== "success" || !outcome.promotion) {
        throw new Error("Nieprawidlowy wynik uruchomienia promocji.");
      }

      response.status(200).json({
        message: "Wykonano promocje.",
        status: outcome.status,
        promotion: serializePromotion(outcome.promotion)
      });
    } catch (error) {
      next(error);
    }
  });

  app.all("/settings", authenticate, (_request, response) => {
    response
      .set("Allow", "GET, PATCH")
      .status(405)
      .json({ error: "Niedozwolona metoda HTTP." });
  });

  app.all("/runpromotion", authenticate, (_request, response) => {
    response
      .set("Allow", "POST")
      .status(405)
      .json({ error: "Niedozwolona metoda HTTP." });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Nie znaleziono endpointu." });
  });

  app.use((error, _request, response, next) => {
    const requestError = mapRequestError(error);

    if (requestError) {
      response.status(requestError.statusCode).json({
        error: requestError.message
      });
      return;
    }

    logger.error(
      `[worker-api] Blad: ${error instanceof Error ? error.message : String(error)}`
    );

    if (response.headersSent) {
      next(error);
      return;
    }

    response.status(500).json({ error: "Blad serwera." });
  });

  return app;
}

export function createWorkerApiServer(options) {
  return createServer(createWorkerApiApp(options));
}

export function listenWorkerApi(server, { host, port }) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

export function closeWorkerApi(server) {
  if (!server?.listening) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
