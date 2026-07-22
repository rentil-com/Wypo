import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { utworzRouterWorkera } from "../routes/worker.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";
import {
  BladApiWorkera,
  KlientApiWorkera,
  utworzKlientaApiWorkeraZEnv
} from "../services/worker-api.js";

function utworzKlienta(overrides = {}) {
  return {
    async pobierzUstawienia() {
      throw new Error("Nieoczekiwane wywolanie pobierzUstawienia.");
    },
    async zaktualizujUstawienia() {
      throw new Error("Nieoczekiwane wywolanie zaktualizujUstawienia.");
    },
    async uruchomPromocje() {
      throw new Error("Nieoczekiwane wywolanie uruchomPromocje.");
    },
    ...overrides
  };
}

async function zBackendem({ uzytkownik, klient }, callback) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    req.uzytkownik = uzytkownik;
    next();
  });
  app.use("/worker", utworzRouterWorkera({ klient }));
  app.use(obsluzBladRoutera);

  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("endpointy workera wymagaja zalogowanego administratora", async () => {
  const klient = utworzKlienta();

  await zBackendem(
    { uzytkownik: null, klient },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/worker/settings`);

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: "Wymagane logowanie."
      });
    }
  );

  await zBackendem(
    {
      uzytkownik: { id: 2, rola: "uzytkownik" },
      klient
    },
    async (baseUrl) => {
      const responses = await Promise.all([
        fetch(`${baseUrl}/worker/settings`),
        fetch(`${baseUrl}/worker/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discount_min_percent: 20 })
        }),
        fetch(`${baseUrl}/worker/runpromotion`, {
          method: "POST"
        })
      ]);

      for (const response of responses) {
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          error: "Brak uprawnien."
        });
      }
    }
  );
});

test("administrator moze pobrac i zmienic ustawienia oraz uruchomic promocje", async () => {
  const wywolania = [];
  const settings = {
    cron_daily_promotion: "0 4 * * *",
    timezone: "Europe/Warsaw",
    discount_min_percent: 15,
    discount_max_percent: 25
  };
  const klient = utworzKlienta({
    async pobierzUstawienia() {
      wywolania.push(["get"]);
      return { settings };
    },
    async zaktualizujUstawienia(body) {
      wywolania.push(["patch", body]);
      return {
        message: "Zaktualizowano ustawienia workera.",
        settings
      };
    },
    async uruchomPromocje() {
      wywolania.push(["run"]);
      return {
        message: "Wykonano zadanie, ale nie znaleziono przedmiotu do promocji.",
        status: "skipped",
        promotion: null
      };
    }
  });

  await zBackendem(
    { uzytkownik: { id: 1, rola: "admin" }, klient },
    async (baseUrl) => {
      const getResponse = await fetch(`${baseUrl}/worker/settings`);
      const patchResponse = await fetch(`${baseUrl}/worker/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount_min_percent: 15 })
      });
      const runResponse = await fetch(`${baseUrl}/worker/runpromotion`, {
        method: "POST"
      });

      assert.equal(getResponse.status, 200);
      assert.deepEqual(await getResponse.json(), { settings });
      assert.equal(patchResponse.status, 200);
      assert.equal(
        (await patchResponse.json()).message,
        "Zaktualizowano ustawienia workera."
      );
      assert.equal(runResponse.status, 200);
      assert.equal((await runResponse.json()).status, "skipped");
      assert.deepEqual(wywolania, [
        ["get"],
        ["patch", { discount_min_percent: 15 }],
        ["run"]
      ]);
    }
  );
});

test("PATCH ustawien wymaga body JSON", async () => {
  const klient = utworzKlienta();

  await zBackendem(
    { uzytkownik: { id: 1, rola: "admin" }, klient },
    async (baseUrl) => {
      const wrongTypeResponse = await fetch(`${baseUrl}/worker/settings`, {
        method: "PATCH",
        body: "{}"
      });
      const emptyResponse = await fetch(`${baseUrl}/worker/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      const malformedResponse = await fetch(`${baseUrl}/worker/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{"
      });

      assert.equal(wrongTypeResponse.status, 415);
      assert.match((await wrongTypeResponse.json()).error, /Content-Type/);
      assert.equal(emptyResponse.status, 400);
      assert.match((await emptyResponse.json()).error, /nie moze byc puste/);
      assert.equal(malformedResponse.status, 400);
      assert.match((await malformedResponse.json()).error, /poprawnego JSON/);
    }
  );
});

test("przekazuje administratorowi bledy walidacji i konflikt workera", async () => {
  let kodHttpWorkera = 400;
  const klient = utworzKlienta({
    async zaktualizujUstawienia() {
      throw new BladApiWorkera("Blad walidacji.", {
        kodHttpWorkera,
        odpowiedzWorkera: {
          error: kodHttpWorkera === 400
            ? "Nieznane ustawienia: sekret."
            : "Promocja jest juz wykonywana.",
          ...(kodHttpWorkera === 409 && { status: "already_running" })
        }
      });
    },
    async uruchomPromocje() {
      return this.zaktualizujUstawienia();
    }
  });

  await zBackendem(
    { uzytkownik: { id: 1, rola: "admin" }, klient },
    async (baseUrl) => {
      const invalidResponse = await fetch(`${baseUrl}/worker/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sekret: "wartosc" })
      });

      kodHttpWorkera = 409;
      const conflictResponse = await fetch(
        `${baseUrl}/worker/runpromotion`,
        { method: "POST" }
      );

      assert.equal(invalidResponse.status, 400);
      assert.match((await invalidResponse.json()).error, /Nieznane ustawienia/);
      assert.equal(conflictResponse.status, 409);
      assert.equal(
        (await conflictResponse.json()).status,
        "already_running"
      );
    }
  );
});

test("nie ujawnia bledu wewnetrznego uwierzytelnienia workera", async () => {
  const klient = utworzKlienta({
    async pobierzUstawienia() {
      throw new BladApiWorkera("Worker odrzucil wewnetrzny klucz.", {
        kodHttpWorkera: 401,
        odpowiedzWorkera: { error: "Nieprawidlowy klucz." }
      });
    }
  });

  await zBackendem(
    { uzytkownik: { id: 1, rola: "admin" }, klient },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/worker/settings`);

      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), {
        error: "Nie udalo sie skomunikowac z workerem."
      });
    }
  );
});

test("brak WORKER_API_URL wylacza integracje bez wymagania pozostalych zmiennych", () => {
  assert.equal(utworzKlientaApiWorkeraZEnv({}), null);
  assert.equal(
    utworzKlientaApiWorkeraZEnv({ WORKER_API_URL: "   " }),
    null
  );
  assert.throws(
    () => utworzKlientaApiWorkeraZEnv({
      WORKER_API_URL: "http://localhost:3001"
    }),
    /WORKER_API_KEY/
  );
});

test("klient API wysyla do workera wewnetrzny Bearer i body ustawien", async () => {
  let request;
  const klient = new KlientApiWorkera({
    baseUrl: "http://worker.internal:3001/",
    apiKey: "tajny-klucz-workera",
    timeoutMs: 1000,
    async fetchImpl(url, options) {
      request = { url, options };
      return new Response(
        JSON.stringify({
          message: "Zaktualizowano ustawienia workera.",
          settings: { discount_min_percent: 20 }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  });

  const response = await klient.zaktualizujUstawienia({
    discount_min_percent: 20
  });

  assert.equal(request.url, "http://worker.internal:3001/settings");
  assert.equal(request.options.method, "PATCH");
  assert.equal(
    request.options.headers.get("Authorization"),
    "Bearer tajny-klucz-workera"
  );
  assert.equal(
    request.options.headers.get("Content-Type"),
    "application/json"
  );
  assert.deepEqual(JSON.parse(request.options.body), {
    discount_min_percent: 20
  });
  assert.equal(response.settings.discount_min_percent, 20);
});
