import { Router } from "express";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";
import { BladApiWorkera } from "../services/worker-api.js";

const PRZEKAZYWANE_STATUSY_WORKERA = new Set([400, 409, 413, 415]);

function obsluzBladApiWorkera(error, req, res, next) {
  if (!(error instanceof BladApiWorkera)) {
    return next(error);
  }

  console.error(error);

  if (
    PRZEKAZYWANE_STATUSY_WORKERA.has(error.kodHttpWorkera) &&
    error.odpowiedzWorkera &&
    typeof error.odpowiedzWorkera === "object"
  ) {
    return res
      .status(error.kodHttpWorkera)
      .json(error.odpowiedzWorkera);
  }

  return res.status(error.kodOdpowiedzi).json({
    error: error.kodOdpowiedzi === 504
      ? "Worker nie odpowiedzial w wymaganym czasie."
      : "Nie udalo sie skomunikowac z workerem."
  });
}

function obsluzNieoczekiwanyBlad(error, req, res, next) {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Body nie zawiera poprawnego JSON."
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Body JSON jest zbyt duze."
    });
  }

  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({ error: "Blad serwera" });
}

export function utworzRouterWorkera({ klient }) {
  if (!klient) {
    throw new Error("Do utworzenia routera workera wymagany jest klient API.");
  }

  const router = Router();
  const administrator = [
    dolaczUzytkownikaZSesji,
    wymagajZalogowania,
    tylkoAdmin
  ];

  router.get("/settings", ...administrator, async (req, res, next) => {
    try {
      return res.status(200).json(await klient.pobierzUstawienia());
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/settings", ...administrator, async (req, res, next) => {
    if (!req.is("application/json")) {
      return res.status(415).json({
        error: "Naglowek Content-Type musi miec wartosc application/json."
      });
    }

    const brakBody = req.body === undefined ||
      req.get("content-length") === "0";

    if (brakBody) {
      return res.status(400).json({
        error: "Body JSON nie moze byc puste."
      });
    }

    try {
      return res
        .status(200)
        .json(await klient.zaktualizujUstawienia(req.body));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/runpromotion", ...administrator, async (req, res, next) => {
    try {
      return res.status(200).json(await klient.uruchomPromocje());
    } catch (error) {
      return next(error);
    }
  });

  router.use(obsluzBladApiWorkera);
  router.use(obsluzNieoczekiwanyBlad);

  return router;
}
