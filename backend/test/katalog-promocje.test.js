import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import listaRouter from "../routes/endpoints/items/lista.js";
import szczegolyRouter from "../routes/endpoints/items/szczegoly.js";
import wyszukajRouter from "../routes/endpoints/items/wyszukaj.js";

function normalizujSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function sprzet(overrides = {}) {
  return {
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
    promocja_data_do: "2026-08-04T00:00:00Z",
    ...overrides
  };
}

async function zRouterem({ uzytkownik, router }, callback) {
  const app = express();

  app.use((req, res, next) => {
    req.uzytkownik = uzytkownik;
    next();
  });
  app.use(router);

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

test("lista filtruje i paginuje po cenie aktualnej dla sesji", async () => {
  const poprzednieQuery = pool.query;
  const wywolania = [];
  pool.query = async (sql, params) => {
    const tekst = normalizujSql(sql);
    wywolania.push([tekst, params]);

    return tekst.includes("COUNT(*)")
      ? { rows: [{ total: "21" }] }
      : { rows: [sprzet()] };
  };

  try {
    await zRouterem(
      { uzytkownik: { id: 10, rola: "uzytkownik" }, router: listaRouter },
      async (baseUrl) => {
        const response = await fetch(
          `${baseUrl}/?strona=2&cena_od=10&cena_do=50&tylko_promocje=true`
        );
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.strona, 2);
        assert.equal(body.total, 21);
        assert.equal(body.liczbaStron, 2);
        assert.equal(body.dane[0].cena, 49.99);
        assert.equal(body.dane[0].cena_aktualna, 39.99);
        assert.equal(body.dane[0].czy_promocja, true);
      }
    );

    assert.match(wywolania[0][0], /LEFT JOIN LATERAL/);
    assert.match(wywolania[0][0], /cena_aktualna >= \$2/);
    assert.match(wywolania[0][0], /cena_aktualna <= \$3/);
    assert.match(wywolania[0][0], /promocja_id IS NOT NULL/);
    assert.deepEqual(wywolania[0][1], [10, 10, 50, 20, 20]);
    assert.deepEqual(wywolania[1][1], [10, 10, 50]);
  } finally {
    pool.query = poprzednieQuery;
  }
});

test("anonimowa wyszukiwarka przekazuje null jako uzytkownika", async () => {
  const poprzednieQuery = pool.query;
  let wywolanie;
  pool.query = async (sql, params) => {
    wywolanie = [normalizujSql(sql), params];

    return {
      rows: [sprzet({
        cena_aktualna: "49.99",
        promocja_id: null,
        promocja_nazwa: null,
        promocja_typ: null,
        promocja_wartosc: null,
        promocja_data_do: null
      })]
    };
  };

  try {
    await zRouterem(
      { uzytkownik: null, router: wyszukajRouter },
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/?q=wiertarka`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body[0].cena_aktualna, 49.99);
        assert.equal(body[0].czy_promocja, false);
        assert.equal(body[0].promocja, null);
      }
    );

    assert.equal(wywolanie[1][0], null);
    assert.match(wywolanie[0], /\$1::integer IS NOT NULL/);
  } finally {
    pool.query = poprzednieQuery;
  }
});

test("szczegoly naliczaja promocje tylko dla aktualnej sesji", async () => {
  const poprzednieQuery = pool.query;
  let paramsZapytania;
  pool.query = async (sql, params) => {
    paramsZapytania = params;
    return { rows: [{ ...sprzet(), specyfikacje: [] }] };
  };

  try {
    await zRouterem(
      { uzytkownik: { id: 25, rola: "uzytkownik" }, router: szczegolyRouter },
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/15`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.promocja.id, 8);
        assert.deepEqual(body.specyfikacje, []);
      }
    );

    assert.deepEqual(paramsZapytania, [15, 25]);
  } finally {
    pool.query = poprzednieQuery;
  }
});
