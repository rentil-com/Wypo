import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import { mapujSprzet } from "../helpers/items.js";
import { mapujWypozyczenie } from "../helpers/wypozyczenia.js";
import promocjeRouter from "../routes/promocje.js";
import {
  BladPromocji,
  mapujSkrotPromocji,
  obliczCenePromocyjna,
  parsujDanePromocji,
  parsujZakresSprzetow,
  parsujZakresUzytkownikow,
  promocjaLateralSql,
  walidujIstnienieZakresow,
  walidujSpojnoscPromocji,
  wyliczStanPromocji,
  zapiszZakresyPromocji
} from "../services/promocje.js";

function normalizujSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim();
}

async function zRouterem({ uzytkownik, router = promocjeRouter }, callback) {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    req.uzytkownik = uzytkownik;
    next();
  });
  app.use("/promocje", router);

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

test("oblicza promocje procentowa z zaokragleniem do dwoch miejsc", () => {
  assert.equal(obliczCenePromocyjna(49.99, "procentowa", 20), 39.99);
  assert.equal(obliczCenePromocyjna(10, "procentowa", 33.33), 6.67);
});

test("oblicza promocje kwotowa i nie schodzi ponizej zera", () => {
  assert.equal(obliczCenePromocyjna(49.99, "kwotowa", 10), 39.99);
  assert.equal(obliczCenePromocyjna(20, "kwotowa", 25), 0);
});

test("wspolny SQL obejmuje wszystkie zakresy, sesje i wybor najlepszej ceny", () => {
  const sql = normalizujSql(promocjaLateralSql({
    sprzetAlias: "s",
    uzytkownikParam: "$7"
  }));

  assert.match(sql, /p\.aktywna = TRUE/);
  assert.match(sql, /p\.data_od <= CURRENT_TIMESTAMP/);
  assert.match(sql, /p\.data_do IS NULL OR p\.data_do > CURRENT_TIMESTAMP/);
  assert.match(sql, /p\.obejmuje_wszystkie_sprzety = TRUE/);
  assert.match(sql, /promocje_kategorie/);
  assert.match(sql, /promocje_sprzety/);
  assert.match(sql, /p\.obejmuje_wszystkich_uzytkownikow = TRUE/);
  assert.match(sql, /\$7::integer IS NOT NULL/);
  assert.match(sql, /promocje_uzytkownicy/);
  assert.match(sql, /ORDER BY cena_aktualna ASC, p\.id ASC/);
  assert.match(sql, /ROUND\(s\.cena \* \(100 - p\.wartosc\) \/ 100, 2\)/);
  assert.match(sql, /GREATEST\(s\.cena - p\.wartosc, 0\)/);
});

test("normalizuje duplikaty kategorii, sprzetow i uzytkownikow", () => {
  assert.deepEqual(
    parsujZakresSprzetow({
      wszystkie: false,
      kategorie_ids: [2, "2", 3],
      sprzety_ids: [15, 15, 16]
    }),
    {
      wszystkie: false,
      kategorie_ids: [2, 3],
      sprzety_ids: [15, 16]
    }
  );
  assert.deepEqual(
    parsujZakresUzytkownikow({
      wszyscy: false,
      uzytkownicy_ids: [10, "10", 25]
    }),
    {
      wszyscy: false,
      uzytkownicy_ids: [10, 25]
    }
  );
});

test("waliduje zakres globalny i zakres ograniczony", () => {
  assert.deepEqual(
    parsujZakresSprzetow({
      wszystkie: true,
      kategorie_ids: [],
      sprzety_ids: []
    }),
    { wszystkie: true, kategorie_ids: [], sprzety_ids: [] }
  );
  assert.deepEqual(
    parsujZakresUzytkownikow({
      wszyscy: true,
      uzytkownicy_ids: []
    }),
    { wszyscy: true, uzytkownicy_ids: [] }
  );

  assert.throws(
    () => parsujZakresSprzetow({
      wszystkie: false,
      kategorie_ids: [],
      sprzety_ids: []
    }),
    BladPromocji
  );
  assert.throws(
    () => parsujZakresUzytkownikow({
      wszyscy: true,
      uzytkownicy_ids: [1]
    }),
    BladPromocji
  );
});

test("waliduje typ, wartosc procentowa i kolejnosc dat", () => {
  const poprawna = parsujDanePromocji({
    nazwa: "Weekend",
    typ: "procentowa",
    wartosc: 20,
    data_od: "2026-08-01T00:00:00Z",
    data_do: "2026-08-04T00:00:00Z",
    zakres_sprzetow: {
      wszystkie: true,
      kategorie_ids: [],
      sprzety_ids: []
    },
    zakres_uzytkownikow: {
      wszyscy: true,
      uzytkownicy_ids: []
    }
  });

  assert.doesNotThrow(() => walidujSpojnoscPromocji(poprawna));
  assert.throws(
    () => walidujSpojnoscPromocji({ ...poprawna, wartosc: 101 }),
    /wartosc/
  );
  assert.throws(
    () => walidujSpojnoscPromocji({
      ...poprawna,
      data_do: poprawna.data_od
    }),
    /Data zakonczenia/
  );
});

test("wylicza zaplanowany, aktywny, wygasly i wylaczony stan", () => {
  const teraz = new Date("2026-08-02T12:00:00Z");
  const baza = {
    aktywna: true,
    data_od: "2026-08-01T00:00:00Z",
    data_do: "2026-08-04T00:00:00Z"
  };

  assert.equal(wyliczStanPromocji(baza, teraz), "aktywna");
  assert.equal(
    wyliczStanPromocji({
      ...baza,
      data_od: "2026-08-03T00:00:00Z"
    }, teraz),
    "zaplanowana"
  );
  assert.equal(
    wyliczStanPromocji({
      ...baza,
      data_do: "2026-08-02T12:00:00Z"
    }, teraz),
    "wygasla"
  );
  assert.equal(
    wyliczStanPromocji({ ...baza, aktywna: false }, teraz),
    "wylaczona"
  );
});

test("odrzuca nieistniejace identyfikatory zakresow", async () => {
  const client = {
    async query(sql) {
      const tekst = normalizujSql(sql);

      if (tekst.includes("FROM kategorie")) {
        return { rows: [{ id: 2 }] };
      }

      if (tekst.includes("FROM sprzety")) {
        return { rows: [] };
      }

      return { rows: [{ id: 10 }] };
    }
  };

  await assert.rejects(
    walidujIstnienieZakresow(
      client,
      {
        wszystkie: false,
        kategorie_ids: [2],
        sprzety_ids: [15]
      },
      {
        wszyscy: false,
        uzytkownicy_ids: [10]
      }
    ),
    (err) => err instanceof BladPromocji && err.status === 404
  );
});

test("zastepuje oba zakresy bez zapytania dla kazdego ID", async () => {
  const wywolania = [];
  const client = {
    async query(sql, params) {
      wywolania.push([normalizujSql(sql), params]);
      return { rows: [] };
    }
  };

  await zapiszZakresyPromocji(
    client,
    8,
    {
      wszystkie: false,
      kategorie_ids: [2, 3],
      sprzety_ids: [15, 16]
    },
    {
      wszyscy: false,
      uzytkownicy_ids: [10, 25]
    }
  );

  assert.equal(wywolania.length, 6);
  assert.match(wywolania[0][0], /^DELETE FROM promocje_kategorie/);
  assert.match(wywolania[1][0], /^DELETE FROM promocje_sprzety/);
  assert.match(wywolania[2][0], /UNNEST\(\$2::integer\[\]\)/);
  assert.deepEqual(wywolania[2][1], [8, [2, 3]]);
  assert.deepEqual(wywolania[3][1], [8, [15, 16]]);
  assert.match(wywolania[4][0], /^DELETE FROM promocje_uzytkownicy/);
  assert.deepEqual(wywolania[5][1], [8, [10, 25]]);
});

test("publiczny skrot promocji nie ujawnia przypisanych uzytkownikow", () => {
  const promocja = mapujSkrotPromocji({
    promocja_id: 8,
    promocja_nazwa: "Weekend",
    promocja_typ: "procentowa",
    promocja_wartosc: "20.00",
    promocja_data_do: "2026-08-04T00:00:00Z",
    uzytkownicy_ids: [10, 25]
  });

  assert.deepEqual(Object.keys(promocja), [
    "id",
    "nazwa",
    "typ",
    "wartosc",
    "data_do"
  ]);
});

test("mapuje sprzet z cena bazowa i cena aktualna", () => {
  const wynik = mapujSprzet({
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
    promocja_data_do: null
  }, false);

  assert.equal(wynik.cena, 49.99);
  assert.equal(wynik.cena_aktualna, 39.99);
  assert.equal(wynik.czy_promocja, true);
  assert.equal(wynik.promocja.id, 8);
  assert.equal("promocja_id" in wynik, false);
});

test("mapuje historyczny snapshot ceny wypozyczenia", () => {
  const wynik = mapujWypozyczenie({
    id: 4,
    sprzet_id: 15,
    uzytkownik_id: 10,
    data_zlozenia: "2026-08-01T00:00:00Z",
    data_od: "2026-08-02T00:00:00Z",
    data_do: "2026-08-03T00:00:00Z",
    status: "oczekujacy",
    data_zwrotu_rzeczywista: null,
    promocja_id: 8,
    cena_bazowa: "49.99",
    cena_koncowa: "39.99",
    promocja_nazwa: "Weekend",
    promocja_typ: "procentowa",
    promocja_wartosc: "20.00"
  });

  assert.equal(wynik.cena_bazowa, 49.99);
  assert.equal(wynik.cena_koncowa, 39.99);
  assert.deepEqual(wynik.promocja, {
    id: 8,
    nazwa: "Weekend",
    typ: "procentowa",
    wartosc: 20
  });
});

test("administracyjne endpointy wymagaja logowania i roli admina", async () => {
  await zRouterem({ uzytkownik: null }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/promocje`);
    assert.equal(response.status, 401);
  });
  await zRouterem(
    { uzytkownik: { id: 2, rola: "uzytkownik" } },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/promocje`);
      assert.equal(response.status, 403);
    }
  );
});

test("POST promocji zapisuje rekord i przypisania w jednej transakcji", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const rekord = {
    id: 8,
    nazwa: "Weekend",
    opis: null,
    typ: "procentowa",
    wartosc: "20.00",
    obejmuje_wszystkie_sprzety: false,
    obejmuje_wszystkich_uzytkownikow: false,
    aktywna: true,
    data_od: "2026-08-01T00:00:00Z",
    data_do: "2026-08-04T00:00:00Z",
    utworzona_przez: 1,
    data_utworzenia: "2026-07-23T00:00:00Z",
    stan: "zaplanowana",
    kategorie_ids: [2],
    sprzety_ids: [15, 16],
    uzytkownicy_ids: [10, 25]
  };
  const client = {
    async query(sql, params) {
      const tekst = normalizujSql(sql);
      wywolania.push([tekst, params]);

      if (tekst.includes("SELECT id FROM kategorie")) {
        return { rows: [{ id: 2 }] };
      }
      if (tekst.includes("SELECT id FROM sprzety")) {
        return { rows: [{ id: 15 }, { id: 16 }] };
      }
      if (tekst.includes("SELECT id FROM uzytkownicy")) {
        return { rows: [{ id: 10 }, { id: 25 }] };
      }
      if (tekst.startsWith("INSERT INTO promocje (")) {
        return { rows: [{ id: 8 }] };
      }
      if (tekst.includes("FROM promocje p")) {
        return { rows: [rekord] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zRouterem(
      { uzytkownik: { id: 1, rola: "admin" } },
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/promocje`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nazwa: "Weekend",
            typ: "procentowa",
            wartosc: 20,
            aktywna: true,
            data_od: "2026-08-01T00:00:00Z",
            data_do: "2026-08-04T00:00:00Z",
            zakres_sprzetow: {
              wszystkie: false,
              kategorie_ids: [2, 2],
              sprzety_ids: [15, 16, 16]
            },
            zakres_uzytkownikow: {
              wszyscy: false,
              uzytkownicy_ids: [10, 25, 25]
            }
          })
        });

        assert.equal(response.status, 201);
        assert.equal((await response.json()).id, 8);
      }
    );

    assert.equal(wywolania[0][0], "BEGIN");
    assert.equal(wywolania.at(-1)[0], "COMMIT");
    assert.equal(
      wywolania.some(([sql]) => sql.startsWith("INSERT INTO promocje (")),
      true
    );
    assert.equal(
      wywolania.some(([sql, params]) =>
        sql.includes("promocje_sprzety") &&
        Array.isArray(params?.[1]) &&
        params[1].join(",") === "15,16"
      ),
      true
    );
  } finally {
    pool.connect = poprzednieConnect;
  }
});

test("POST promocji wycofuje transakcje dla nieistniejacego zakresu", async () => {
  const poprzednieConnect = pool.connect;
  const wywolania = [];
  const client = {
    async query(sql) {
      const tekst = normalizujSql(sql);
      wywolania.push(tekst);

      if (tekst.includes("SELECT id FROM")) {
        return { rows: [] };
      }

      return { rows: [] };
    },
    release() {}
  };
  pool.connect = async () => client;

  try {
    await zRouterem(
      { uzytkownik: { id: 1, rola: "admin" } },
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/promocje`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nazwa: "Weekend",
            typ: "kwotowa",
            wartosc: 10,
            zakres_sprzetow: {
              wszystkie: false,
              kategorie_ids: [],
              sprzety_ids: [999]
            },
            zakres_uzytkownikow: {
              wszyscy: true,
              uzytkownicy_ids: []
            }
          })
        });

        assert.equal(response.status, 404);
      }
    );

    assert.equal(wywolania.includes("ROLLBACK"), true);
    assert.equal(
      wywolania.some((sql) => sql.startsWith("INSERT INTO promocje (")),
      false
    );
  } finally {
    pool.connect = poprzednieConnect;
  }
});
