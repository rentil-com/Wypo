import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import promocjeRouter from "../routes/promocje.js";

function normalizujSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function rekordPromocji(overrides = {}) {
  return {
    id: 8,
    nazwa: "Weekend",
    opis: null,
    typ: "procentowa",
    wartosc: "20.00",
    obejmuje_wszystkie_sprzety: true,
    obejmuje_wszystkich_uzytkownikow: true,
    aktywna: true,
    data_od: "2026-08-01T00:00:00Z",
    data_do: "2026-08-04T00:00:00Z",
    utworzona_przez: 1,
    data_utworzenia: "2026-07-23T00:00:00Z",
    stan: "zaplanowana",
    kategorie_ids: [],
    sprzety_ids: [],
    uzytkownicy_ids: [],
    ...overrides
  };
}

async function zRouterem(callback) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    req.uzytkownik = { id: 1, rola: "admin" };
    next();
  });
  app.use("/promocje", promocjeRouter);

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

test("PATCH blokuje rekord i transakcyjnie zastepuje przekazany zakres", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.includes("FROM promocje p") && tekst.includes("FOR UPDATE")) {
        return { rows: [rekordPromocji()] };
      }
      if (tekst.includes("SELECT id FROM sprzety")) {
        return { rows: [{ id: 16 }] };
      }
      if (
        tekst.includes("SELECT id FROM kategorie") ||
        tekst.includes("SELECT id FROM uzytkownicy")
      ) {
        return { rows: [] };
      }
      if (tekst.includes("FROM promocje p")) {
        return {
          rows: [rekordPromocji({
            aktywna: false,
            stan: "wylaczona",
            obejmuje_wszystkie_sprzety: false,
            sprzety_ids: [16]
          })]
        };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zRouterem(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/promocje/8`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aktywna: false,
          zakres_sprzetow: {
            wszystkie: false,
            kategorie_ids: [],
            sprzety_ids: [16, 16]
          }
        })
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.aktywna, false);
      assert.deepEqual(body.zakres_sprzetow.sprzety_ids, [16]);
    });

    assert.equal(wywolania[0][0], "BEGIN");
    assert.match(wywolania[1][0], /FOR UPDATE OF p/);
    assert.equal(
      wywolania.some(([sql]) =>
        sql.startsWith("DELETE FROM promocje_kategorie")
      ),
      true
    );
    assert.equal(
      wywolania.some(([sql]) =>
        sql.startsWith("DELETE FROM promocje_uzytkownicy")
      ),
      false
    );
    assert.equal(wywolania.at(-1)[0], "COMMIT");
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("GET listy stosuje filtry i paginacje administratora", async () => {
  const poprzednieQuery = pool.query;
  const wywolania = [];
  const rekord = rekordPromocji();
  pool.query = async (sql, params) => {
    const tekst = normalizujSql(sql);
    wywolania.push([tekst, params]);

    return tekst.includes("COUNT(*)")
      ? { rows: [{ total: "1" }] }
      : { rows: [rekord] };
  };

  try {
    await zRouterem(async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/promocje?strona=2&nazwa=Week&typ=procentowa&stan=zaplanowana&sprzet_id=15&kategoria_id=2&uzytkownik_id=10`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.strona, 2);
      assert.equal(body.total, 1);
      assert.equal(body.filtry.sprzet_id, 15);
      assert.equal(body.dane[0].id, 8);
    });

    assert.equal(wywolania.length, 2);
    assert.match(wywolania[0][0], /p\.nazwa ILIKE/);
    assert.match(wywolania[0][0], /p\.typ =/);
    assert.match(wywolania[0][0], /obejmuje_wszystkie_sprzety/);
    assert.match(wywolania[0][0], /obejmuje_wszystkich_uzytkownikow/);
    assert.deepEqual(wywolania[0][1].slice(-2), [20, 20]);
  } finally {
    pool.query = poprzednieQuery;
  }
});
