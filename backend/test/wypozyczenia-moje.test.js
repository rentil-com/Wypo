import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import { LIMIT_WNIOSKOW_NA_STRONE } from "../helpers/constants.js";
import wypozyczeniaRouter from "../routes/wypozyczenia.js";

async function zRouterem(uzytkownik, callback) {
  const app = express();

  app.use((req, res, next) => {
    req.uzytkownik = uzytkownik;
    next();
  });
  app.use("/wypozyczenia", wypozyczeniaRouter);

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

test("zwraca tylko wypozyczenia zalogowanego uzytkownika", async () => {
  const poprzednieQuery = pool.query;
  const zapytania = [];

  pool.query = async (sql, params) => {
    zapytania.push({ sql, params });

    if (sql.includes("COUNT(*)")) {
      return { rows: [{ total: "11" }] };
    }

    return {
      rows: [
        {
          id: "31",
          sprzet_id: "8",
          uzytkownik_id: "17",
          data_zlozenia: "2026-07-27T08:00:00.000Z",
          data_od: "2026-07-28T08:00:00.000Z",
          data_do: "2026-07-30T08:00:00.000Z",
          status: "zaakceptowany",
          data_zwrotu_rzeczywista: null,
          promocja_id: null,
          cena_bazowa: "40.00",
          cena_koncowa: "40.00",
          promocja_nazwa: null,
          promocja_typ: null,
          promocja_wartosc: null
        }
      ]
    };
  };

  try {
    await zRouterem(
      { id: 17, rola: "uzytkownik" },
      async (baseUrl) => {
        const response = await fetch(
          `${baseUrl}/wypozyczenia/moje?strona=2&uzytkownik_id=999`
        );
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.strona, 2);
        assert.equal(body.limitWnioskowNaStrone, LIMIT_WNIOSKOW_NA_STRONE);
        assert.equal(body.total, 11);
        assert.equal(body.liczbaStron, 2);
        assert.equal(body.dane.length, 1);
        assert.equal(body.dane[0].id, 31);
        assert.equal(body.dane[0].uzytkownik_id, 17);
      }
    );

    assert.equal(zapytania.length, 2);
    assert.ok(zapytania[0].sql.includes("WHERE w.uzytkownik_id = $1"));
    assert.deepEqual(zapytania[0].params, [
      17,
      LIMIT_WNIOSKOW_NA_STRONE,
      LIMIT_WNIOSKOW_NA_STRONE
    ]);
    assert.ok(zapytania[1].sql.includes("WHERE uzytkownik_id = $1"));
    assert.deepEqual(zapytania[1].params, [17]);
  } finally {
    pool.query = poprzednieQuery;
  }
});

test("wymaga zalogowania", async () => {
  const poprzednieQuery = pool.query;
  let liczbaZapytan = 0;

  pool.query = async () => {
    liczbaZapytan += 1;
    throw new Error("Baza nie powinna byc wywolywana bez zalogowania.");
  };

  try {
    await zRouterem(null, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/wypozyczenia/moje`);
      const body = await response.json();

      assert.equal(response.status, 401);
      assert.equal(body.error, "Wymagane logowanie.");
    });

    assert.equal(liczbaZapytan, 0);
  } finally {
    pool.query = poprzednieQuery;
  }
});
