import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import wypozyczRouter from "../routes/endpoints/wypozyczenia/wypozycz.js";

function normalizujSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

async function zRouterem(callback) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    req.uzytkownik = { id: 10, rola: "uzytkownik" };
    next();
  });
  app.use("/wypozycz", wypozyczRouter);

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

test("wypozyczenie zapisuje snapshot promocji wyliczonej na serwerze", async () => {
  const poprzednieConnect = pool.connect;
  const poprzednieQuery = pool.query;
  const wywolania = [];
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.includes("FROM sprzety s")) {
        return {
          rows: [{
            id: 15,
            nazwa: "Wiertarka",
            opis: null,
            kategoria_id: 2,
            status: "dostepny",
            zdjecia_url: {},
            cena: "49.99",
            cena_aktualna: "39.99",
            promocja_id: 8,
            promocja_nazwa: "Weekend",
            promocja_typ: "procentowa",
            promocja_wartosc: "20.00",
            promocja_data_do: "2026-08-04T00:00:00Z"
          }]
        };
      }

      if (tekst.startsWith("INSERT INTO wypozyczenia")) {
        return {
          rows: [{
            id: 4,
            sprzet_id: 15,
            uzytkownik_id: 10,
            data_zlozenia: "2026-07-23T00:00:00Z",
            data_od: "2026-08-01T00:00:00Z",
            data_do: "2026-08-03T00:00:00Z",
            status: "oczekujacy",
            data_zwrotu_rzeczywista: null,
            promocja_id: 8,
            cena_bazowa: "49.99",
            cena_koncowa: "39.99",
            promocja_nazwa: "Weekend",
            promocja_typ: "procentowa",
            promocja_wartosc: "20.00"
          }]
        };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;
  pool.query = async () => ({ rows: [] });

  try {
    await zRouterem(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/wypozycz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprzet_id: 15,
          data_od: "2026-08-01T00:00:00Z",
          data_do: "2026-08-03T00:00:00Z"
        })
      });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.cena_bazowa, 49.99);
      assert.equal(body.cena_koncowa, 39.99);
      assert.equal(body.promocja.id, 8);
    });

    assert.equal(wywolania[0][0], "BEGIN");
    assert.match(wywolania[1][0], /FOR UPDATE OF s/);
    assert.match(wywolania[1][0], /ORDER BY cena_aktualna ASC, p\.id ASC/);
    assert.deepEqual(wywolania[1][1], [15, 10]);

    const insert = wywolania.find(([sql]) =>
      sql.startsWith("INSERT INTO wypozyczenia")
    );
    assert.deepEqual(insert[1].slice(4), [
      8,
      "49.99",
      "39.99",
      "Weekend",
      "procentowa",
      "20.00"
    ]);
    assert.equal(wywolania.at(-1)[0], "COMMIT");
  } finally {
    pool.connect = poprzednieConnect;
    pool.query = poprzednieQuery;
  }
});

test("uzytkownik nie moze przeslac ceny koncowej ani promocja_id", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  pool.connect = async () => ({
    async query(sql) {
      wywolania.push(normalizujSql(sql));
      return { rows: [] };
    },
    release() {}
  });

  try {
    await zRouterem(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/wypozycz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprzet_id: 15,
          data_od: "2026-08-01T00:00:00Z",
          data_do: "2026-08-03T00:00:00Z",
          cena_koncowa: 1,
          promocja_id: 999
        })
      });

      assert.equal(response.status, 400);
    });

    assert.deepEqual(wywolania, []);
  } finally {
    pool.connect = poprzednieConnect;
  }
});
