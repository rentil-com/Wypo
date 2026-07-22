import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import kluczApiRouter from "../routes/endpoints/sessions/klucz-api.js";

async function zRouteremKluczaApi(callback) {
  const app = express();

  app.use((req, res, next) => {
    req.uzytkownik = {
      id: 7,
      rola: "admin",
      dwuetapowe: true
    };
    next();
  });
  app.use("/auth/api-key", kluczApiRouter);

  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("konto administratora z 2FA moze wygenerowac klucz API", async () => {
  const poprzednieQuery = pool.query;
  const poprzednieConnect = pool.connect;
  const zapytania = [];
  let zwolnionoKlienta = false;
  const dataUtworzenia = new Date("2026-07-22T10:00:00.000Z");
  const client = {
    async query(sql, params = []) {
      const tekst = String(sql);
      zapytania.push({ tekst, params });

      if (/SELECT rola/.test(tekst)) {
        assert.doesNotMatch(tekst, /dwuetapowe/);
        return { rows: [{ rola: "admin" }] };
      }

      if (/INSERT INTO klucze_api/.test(tekst)) {
        assert.equal(params[0], 7);
        assert.match(params[1], /^[a-f0-9]{64}$/);
        return { rows: [{ data_utworzenia: dataUtworzenia }] };
      }

      return { rows: [], rowCount: 0 };
    },
    release() {
      zwolnionoKlienta = true;
    }
  };

  pool.query = async (sql, params) => {
    assert.match(sql, /FROM klucze_api/);
    assert.deepEqual(params, [7]);
    return { rows: [] };
  };
  pool.connect = async () => client;

  try {
    await zRouteremKluczaApi(async (baseUrl) => {
      const statusResponse = await fetch(`${baseUrl}/auth/api-key`);
      const generateResponse = await fetch(`${baseUrl}/auth/api-key`, {
        method: "POST"
      });
      const statusBody = await statusResponse.json();
      const generateBody = await generateResponse.json();

      assert.equal(statusResponse.status, 200);
      assert.equal(statusBody.can_generate, true);
      assert.equal(generateResponse.status, 201);
      assert.match(generateBody.api_key, /^wypo_[a-f0-9]{64}$/);
      assert.equal(generateBody.created_at, dataUtworzenia.toISOString());
    });

    assert.equal(
      zapytania.some(({ tekst }) => /INSERT INTO klucze_api/.test(tekst)),
      true
    );
    assert.equal(
      zapytania.some(({ tekst }) => /ROLLBACK/.test(tekst)),
      false
    );
    assert.equal(zwolnionoKlienta, true);
  } finally {
    pool.query = poprzednieQuery;
    pool.connect = poprzednieConnect;
  }
});
