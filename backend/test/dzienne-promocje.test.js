import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import promocjeRouter from "../routes/promocje.js";
import {
  pobierzKonfiguracjeDziennejPromocji,
  wylosujRabatProcentowy
} from "../services/dzienne-promocje.js";

function normalizujSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

function rekordPromocji(overrides = {}) {
  return {
    id: 8,
    nazwa: "Dzienna promocja",
    opis: "Indywidualna promocja wylosowana dla uzytkownika.",
    typ: "procentowa",
    wartosc: "15.00",
    obejmuje_wszystkie_sprzety: true,
    obejmuje_wszystkich_uzytkownikow: false,
    aktywna: true,
    data_od: "2026-07-24T10:00:00.000Z",
    data_do: "2099-07-25T10:00:00.000Z",
    utworzona_przez: 10,
    data_utworzenia: "2026-07-24T10:00:00.000Z",
    stan: "aktywna",
    kategorie_ids: [],
    sprzety_ids: [],
    uzytkownicy_ids: [10],
    ...overrides
  };
}

async function zRouterem(uzytkownik, callback) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    req.uzytkownik = uzytkownik;
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

async function zEnv(wartosci, callback) {
  const poprzednie = {};

  for (const [nazwa, wartosc] of Object.entries(wartosci)) {
    poprzednie[nazwa] = process.env[nazwa];
    process.env[nazwa] = wartosc;
  }

  try {
    return await callback();
  } finally {
    for (const [nazwa, wartosc] of Object.entries(poprzednie)) {
      if (wartosc === undefined) {
        delete process.env[nazwa];
      } else {
        process.env[nazwa] = wartosc;
      }
    }
  }
}

test("czyta czas, rabaty i tekst dziennej promocji z env", async () => {
  await zEnv({
    DZIENNA_PROMOCJA_WAZNOSC_GODZIN: "12",
    DZIENNA_PROMOCJA_RABATY_PROCENTOWE: "7.5,15,30",
    DZIENNA_PROMOCJA_NAZWA: "Szczesliwy dzien",
    DZIENNA_PROMOCJA_OPIS: "Opis z konfiguracji"
  }, async () => {
    assert.deepEqual(pobierzKonfiguracjeDziennejPromocji(), {
      czasWaznosciGodziny: 12,
      rabatyProcentowe: [7.5, 15, 30],
      nazwa: "Szczesliwy dzien",
      opis: "Opis z konfiguracji"
    });
  });

  assert.equal(wylosujRabatProcentowy([5, 10, 25], () => 0.99), 25);
});

test("endpointy dziennej promocji wymagaja wlasciwego uwierzytelnienia", async () => {
  await zRouterem(null, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/promocje/losuj-dzienna-promocje`,
      { method: "POST" }
    );

    assert.equal(response.status, 401);
  });

  await zRouterem(
    { id: 10, rola: "uzytkownik" },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/promocje/losuj-dzienna-promocja/25`,
        { method: "POST" }
      );

      assert.equal(response.status, 403);
    }
  );
});

test("uzytkownik losuje skonfigurowana promocje i dostaje termin kolejnego losowania", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  let parametryPromocji = null;
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.startsWith("SELECT id FROM uzytkownicy")) {
        return { rows: [{ id: 10 }] };
      }
      if (tekst.includes("JOIN promocje_uzytkownicy dzienny_uzytkownik")) {
        return { rows: [] };
      }
      if (tekst.startsWith("INSERT INTO promocje (")) {
        parametryPromocji = params;
        return { rows: [{ id: 11 }] };
      }
      if (tekst.includes("FROM promocje p")) {
        return {
          rows: [rekordPromocji({
            id: 11,
            nazwa: parametryPromocji[0],
            opis: parametryPromocji[1],
            wartosc: String(parametryPromocji[2]),
            data_od: parametryPromocji[3],
            data_do: parametryPromocji[4],
            utworzona_przez: parametryPromocji[5]
          })]
        };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zEnv({
      DZIENNA_PROMOCJA_WAZNOSC_GODZIN: "2",
      DZIENNA_PROMOCJA_RABATY_PROCENTOWE: "17.5",
      DZIENNA_PROMOCJA_NAZWA: "Dwie godziny",
      DZIENNA_PROMOCJA_OPIS: "Testowa promocja"
    }, async () => {
      await zRouterem(
        { id: 10, rola: "uzytkownik" },
        async (baseUrl) => {
          const response = await fetch(
            `${baseUrl}/promocje/losuj-dzienna-promocje`,
            { method: "POST" }
          );
          const body = await response.json();

          assert.equal(response.status, 201);
          assert.equal(body.promocja.id, 11);
          assert.equal(body.promocja.wartosc, 17.5);
          assert.equal(body.promocja.zakres_sprzetow.wszystkie, true);
          assert.deepEqual(
            body.promocja.zakres_uzytkownikow.uzytkownicy_ids,
            [10]
          );
          assert.equal(
            body.ponowne_losowanie_od,
            body.promocja.data_do
          );
          assert.equal(body.zastapiona_promocja_id, null);
        }
      );
    });

    assert.equal(
      new Date(parametryPromocji[4]).getTime() -
        new Date(parametryPromocji[3]).getTime(),
      2 * 60 * 60 * 1000
    );
    assert.equal(parametryPromocji[5], 10);
    assert.equal(
      wywolania.some(([sql, params]) =>
        sql.startsWith("INSERT INTO promocje_uzytkownicy") &&
        params[0] === 11 &&
        params[1] === 10
      ),
      true
    );
    const wyszukanieAktualnej = wywolania.find(([sql]) =>
      sql.includes("JOIN promocje_uzytkownicy dzienny_uzytkownik")
    );

    assert.ok(wyszukanieAktualnej);
    assert.match(wyszukanieAktualnej[0], /obejmuje_wszystkie_sprzety = TRUE/);
    assert.match(wyszukanieAktualnej[0], /obejmuje_wszystkich_uzytkownikow = FALSE/);
    assert.match(wyszukanieAktualnej[0], /NOT EXISTS/);
    assert.equal(wywolania.at(-1)[0], "COMMIT");
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("aktywna promocja blokuje kolejne losowanie uzytkownika", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const aktywna = rekordPromocji();
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.startsWith("SELECT id FROM uzytkownicy")) {
        return { rows: [{ id: 10 }] };
      }
      if (tekst.includes("JOIN promocje_uzytkownicy dzienny_uzytkownik")) {
        return { rows: [aktywna] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zRouterem(
      { id: 10, rola: "uzytkownik" },
      async (baseUrl) => {
        const response = await fetch(
          `${baseUrl}/promocje/losuj-dzienna-promocje`,
          { method: "POST" }
        );
        const body = await response.json();

        assert.equal(response.status, 409);
        assert.equal(body.promocja.id, 8);
        assert.equal(body.ponowne_losowanie_od, aktywna.data_do);
      }
    );

    assert.equal(
      wywolania.some(([sql]) => sql.startsWith("INSERT INTO promocje (")),
      false
    );
    assert.equal(wywolania.at(-1)[0], "COMMIT");
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("po wygasnieciu uzytkownik moze wylosowac nastepna promocje", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const wygasla = rekordPromocji({
    data_do: "2020-01-01T00:00:00.000Z",
    stan: "wygasla"
  });
  const nowa = rekordPromocji({
    id: 12,
    wartosc: "10.00",
    data_do: "2099-08-01T00:00:00.000Z"
  });
  const client = {
    async query(sql) {
      const tekst = normalizujSql(sql);
      wywolania.push(tekst);

      if (tekst.startsWith("SELECT id FROM uzytkownicy")) {
        return { rows: [{ id: 10 }] };
      }
      if (tekst.includes("JOIN promocje_uzytkownicy dzienny_uzytkownik")) {
        return { rows: [wygasla] };
      }
      if (tekst.startsWith("INSERT INTO promocje (")) {
        return { rows: [{ id: 12 }] };
      }
      if (tekst.includes("FROM promocje p")) {
        return { rows: [nowa] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zEnv({
      DZIENNA_PROMOCJA_RABATY_PROCENTOWE: "10"
    }, async () => {
      await zRouterem(
        { id: 10, rola: "uzytkownik" },
        async (baseUrl) => {
          const response = await fetch(
            `${baseUrl}/promocje/losuj-dzienna-promocje`,
            { method: "POST" }
          );
          const body = await response.json();

          assert.equal(response.status, 201);
          assert.equal(body.promocja.id, 12);
        }
      );
    });

    assert.equal(
      wywolania.some((sql) => sql.startsWith("UPDATE promocje SET")),
      false
    );
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("administrator wymusza reset aktywnej promocji wskazanego uzytkownika", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const aktywna = rekordPromocji();
  const nowa = rekordPromocji({
    id: 13,
    wartosc: "30.00",
    utworzona_przez: 1
  });
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.startsWith("SELECT id FROM uzytkownicy")) {
        return { rows: [{ id: 10 }] };
      }
      if (tekst.includes("JOIN promocje_uzytkownicy dzienny_uzytkownik")) {
        return { rows: [aktywna] };
      }
      if (tekst.startsWith("INSERT INTO promocje (")) {
        return { rows: [{ id: 13 }] };
      }
      if (tekst.includes("FROM promocje p")) {
        return { rows: [nowa] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zEnv({
      DZIENNA_PROMOCJA_RABATY_PROCENTOWE: "30"
    }, async () => {
      await zRouterem(
        { id: 1, rola: "admin" },
        async (baseUrl) => {
          const response = await fetch(
            `${baseUrl}/promocje/losuj-dzienna-promocja/10`,
            { method: "POST" }
          );
          const body = await response.json();

          assert.equal(response.status, 201);
          assert.equal(body.promocja.id, 13);
          assert.equal(body.zastapiona_promocja_id, 8);
        }
      );
    });

    const aktualizacja = wywolania.find(([sql]) =>
      sql.startsWith("UPDATE promocje SET aktywna = FALSE")
    );
    const wstawienie = wywolania.find(([sql]) =>
      sql.startsWith("INSERT INTO promocje (")
    );
    const przypisanie = wywolania.find(([sql]) =>
      sql.startsWith("INSERT INTO promocje_uzytkownicy")
    );

    assert.deepEqual(aktualizacja[1], [8]);
    assert.equal(wstawienie[1][5], 1);
    assert.deepEqual(przypisanie[1], [13, 10]);
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("reset nieistniejacego uzytkownika zwraca 404 i wycofuje transakcje", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const client = {
    async query(sql) {
      const tekst = normalizujSql(sql);
      wywolania.push(tekst);

      if (tekst.startsWith("SELECT id FROM uzytkownicy")) {
        return { rows: [] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zRouterem(
      { id: 1, rola: "admin" },
      async (baseUrl) => {
        const response = await fetch(
          `${baseUrl}/promocje/losuj-dzienna-promocja/999`,
          { method: "POST" }
        );

        assert.equal(response.status, 404);
      }
    );

    assert.equal(wywolania.at(-1), "ROLLBACK");
  } finally {
    pool.connect = poprzednieConnect;
  }
});
