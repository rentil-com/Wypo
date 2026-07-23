import assert from "node:assert/strict";
import test from "node:test";
import {
  closeWorkerApi,
  createWorkerApiServer,
  listenWorkerApi
} from "../src/api/worker-api.js";

const API_KEY = "test-worker-api-key";

function createRepository(overrides = {}) {
  const rawSettings = {
    cron_daily_promotion: "0 3 * * *",
    timezone: "Europe/Warsaw",
    discount_min_percent: "10",
    discount_max_percent: "20"
  };
  const writes = [];

  return {
    rawSettings,
    writes,
    async getAll() {
      return { ...rawSettings };
    },
    async setMany(entries) {
      writes.push(entries);

      for (const [key, value] of entries) {
        rawSettings[key] = String(value);
      }
    },
    ...overrides
  };
}

async function withApi(
  callback,
  {
    repository = createRepository(),
    runPromotion = async () => ({ status: "skipped" }),
    onSettingsUpdated
  } = {}
) {
  const server = createWorkerApiServer({
    repository,
    apiKey: API_KEY,
    runPromotion,
    onSettingsUpdated
  });

  await listenWorkerApi(server, { host: "127.0.0.1", port: 0 });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await callback({ baseUrl, repository });
  } finally {
    await closeWorkerApi(server);
  }
}

function authorizedHeaders(additionalHeaders = {}) {
  return {
    Authorization: `Bearer ${API_KEY}`,
    ...additionalHeaders
  };
}

test("odrzuca brak lub nieprawidlowy WORKER_API_KEY", async () => {
  await withApi(async ({ baseUrl }) => {
    const missingKeyResponse = await fetch(`${baseUrl}/settings`);
    const wrongKeyResponse = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: "Bearer wrong-key" }
    });
    const [missingKeyBody, wrongKeyBody] = await Promise.all([
      missingKeyResponse.json(),
      wrongKeyResponse.json()
    ]);

    assert.equal(missingKeyResponse.status, 401);
    assert.equal(wrongKeyResponse.status, 401);
    assert.equal(missingKeyBody.error, "Brak lub nieprawidlowy klucz API.");
    assert.equal(wrongKeyBody.error, "Brak lub nieprawidlowy klucz API.");
    assert.equal(
      missingKeyResponse.headers.get("www-authenticate"),
      "Bearer"
    );
  });
});

test("zwraca ustawienia po uwierzytelnieniu Bearer", async () => {
  await withApi(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/settings`, {
      headers: authorizedHeaders()
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      settings: {
        cron_daily_promotion: "0 3 * * *",
        timezone: "Europe/Warsaw",
        discount_min_percent: 10,
        discount_max_percent: 20
      }
    });
  });
});

test("aktualizuje kilka ustawien atomowo i przeladowuje konfiguracje", async () => {
  const appliedSettings = [];

  await withApi(
    async ({ baseUrl, repository }) => {
      const response = await fetch(`${baseUrl}/settings`, {
        method: "PATCH",
        headers: authorizedHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          discount_min_percent: 30,
          discount_max_percent: 40,
          cron_daily_promotion: "0 4 * * *"
        })
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(body.settings, {
        cron_daily_promotion: "0 4 * * *",
        timezone: "Europe/Warsaw",
        discount_min_percent: 30,
        discount_max_percent: 40
      });
      assert.deepEqual(repository.writes, [
        [
          ["discount_min_percent", "30"],
          ["discount_max_percent", "40"],
          ["cron_daily_promotion", "0 4 * * *"]
        ]
      ]);
      assert.equal(appliedSettings.length, 1);
      assert.equal(appliedSettings[0].cronDailyPromotion, "0 4 * * *");
    },
    {
      onSettingsUpdated(settings) {
        appliedSettings.push(settings);
      }
    }
  );
});

test("uruchamia promocje recznie i zwraca jej wynik", async () => {
  let calls = 0;

  await withApi(
    async ({ baseUrl }) => {
      const response = await fetch(`${baseUrl}/runpromotion`, {
        method: "POST",
        headers: authorizedHeaders()
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        message: "Wykonano promocje.",
        status: "success",
        promotion: {
          promotion_id: 23,
          item_id: 7,
          item_name: "Wiertarka testowa",
          old_price: 100,
          discount_percent: 20,
          promotional_price: 80
        }
      });
      assert.equal(calls, 1);
    },
    {
      async runPromotion() {
        calls += 1;
        return {
          status: "success",
          promotion: {
            backendPromotionId: 23,
            item: { id: 7, nazwa: "Wiertarka testowa" },
            oldPrice: 100,
            discountPercent: 20,
            promotionalPrice: 80
          }
        };
      }
    }
  );
});

test("chroni runpromotion i zwraca konflikt, gdy promocja juz trwa", async () => {
  let calls = 0;

  await withApi(
    async ({ baseUrl }) => {
      const unauthorizedResponse = await fetch(`${baseUrl}/runpromotion`, {
        method: "POST"
      });
      const busyResponse = await fetch(`${baseUrl}/runpromotion`, {
        method: "POST",
        headers: authorizedHeaders()
      });

      assert.equal(unauthorizedResponse.status, 401);
      assert.equal(busyResponse.status, 409);
      assert.deepEqual(await busyResponse.json(), {
        error: "Promocja jest juz wykonywana.",
        status: "already_running"
      });
      await unauthorizedResponse.json();
      assert.equal(calls, 1);
    },
    {
      async runPromotion() {
        calls += 1;
        return { status: "already_running" };
      }
    }
  );
});

test("nie zapisuje nieprawidlowych ani nieznanych ustawien", async () => {
  await withApi(async ({ baseUrl, repository }) => {
    const invalidRangeResponse = await fetch(`${baseUrl}/settings`, {
      method: "PATCH",
      headers: authorizedHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ discount_min_percent: 30 })
    });
    const unknownKeyResponse = await fetch(`${baseUrl}/settings`, {
      method: "PATCH",
      headers: authorizedHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ backend_api_key: "secret" })
    });
    const [invalidRangeBody, unknownKeyBody] = await Promise.all([
      invalidRangeResponse.json(),
      unknownKeyResponse.json()
    ]);

    assert.equal(invalidRangeResponse.status, 400);
    assert.match(invalidRangeBody.error, /nie moze byc wieksze/);
    assert.equal(unknownKeyResponse.status, 400);
    assert.match(unknownKeyBody.error, /Nieznane ustawienia/);
    assert.deepEqual(repository.writes, []);
  });
});

test("wymaga poprawnego JSON i obsluguje tylko GET oraz PATCH", async () => {
  await withApi(async ({ baseUrl }) => {
    const malformedJsonResponse = await fetch(`${baseUrl}/settings`, {
      method: "PATCH",
      headers: authorizedHeaders({
        "Content-Type": "application/json"
      }),
      body: "{"
    });
    const postResponse = await fetch(`${baseUrl}/settings`, {
      method: "POST",
      headers: authorizedHeaders()
    });

    await Promise.all([
      malformedJsonResponse.json(),
      postResponse.json()
    ]);

    assert.equal(malformedJsonResponse.status, 400);
    assert.equal(postResponse.status, 405);
    assert.equal(postResponse.headers.get("allow"), "GET, PATCH");
  });
});
