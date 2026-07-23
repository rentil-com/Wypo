import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { BackendClient } from "../src/clients/backend-client.js";

async function zBackendem(callback) {
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];

    for await (const chunk of request) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString("utf8");
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      body: body ? JSON.parse(body) : null
    });

    response.setHeader("Content-Type", "application/json");

    if (request.method === "POST" && request.url === "/promocje") {
      response.statusCode = 201;
      response.end(JSON.stringify({ id: 71 }));
      return;
    }

    if (request.method === "PATCH" && request.url === "/promocje/71") {
      response.statusCode = 200;
      response.end(JSON.stringify({ id: 71, aktywna: false }));
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: "Nie znaleziono endpointu." }));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();

  try {
    await callback({
      client: new BackendClient({
        baseUrl: `http://127.0.0.1:${address.port}`,
        apiKey: "worker-backend-key",
        timeoutMs: 1000
      }),
      requests
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("tworzy i dezaktywuje promocje przez nowe API backendu", async () => {
  await zBackendem(async ({ client, requests }) => {
    const payload = {
      nazwa: "Promocja dnia: Wiertarka",
      typ: "procentowa",
      wartosc: 20,
      zakres_sprzetow: {
        wszystkie: false,
        kategorie_ids: [],
        sprzety_ids: [15]
      },
      zakres_uzytkownikow: {
        wszyscy: true,
        uzytkownicy_ids: []
      }
    };

    assert.deepEqual(await client.createPromotion(payload), { id: 71 });
    assert.deepEqual(await client.deactivatePromotion(71), {
      id: 71,
      aktywna: false
    });

    assert.deepEqual(requests.map(({ method, url }) => ({ method, url })), [
      { method: "POST", url: "/promocje" },
      { method: "PATCH", url: "/promocje/71" }
    ]);
    assert.equal(requests[0].authorization, "Bearer worker-backend-key");
    assert.deepEqual(requests[0].body, payload);
    assert.deepEqual(requests[1].body, { aktywna: false });
  });
});
