import test from "node:test";
import assert from "node:assert/strict";
import { pool } from "../db/pool.js";
import {
  czyPoprawnyFormatKluczaApi,
  generujKluczApi,
  hashujKluczApi,
  normalizujKluczApi,
  pobierzAdminaZKluczaApi,
  pobierzBearerZZadania
} from "../services/klucze-api.js";

test("generuje unikalne klucze API w oczekiwanym formacie", () => {
  const pierwszy = generujKluczApi();
  const drugi = generujKluczApi();

  assert.match(pierwszy, /^wypo_[a-f0-9]{64}$/);
  assert.equal(czyPoprawnyFormatKluczaApi(pierwszy), true);
  assert.notEqual(pierwszy, drugi);
});

test("odrzuca nieprawidlowy format klucza API", () => {
  assert.equal(czyPoprawnyFormatKluczaApi("wypo_1234"), false);
  assert.equal(czyPoprawnyFormatKluczaApi("Wypo_" + "a".repeat(64)), false);
  assert.equal(czyPoprawnyFormatKluczaApi(""), false);
});

test("pobiera klucz tylko z naglowka Authorization Bearer", () => {
  const klucz = generujKluczApi();

  assert.equal(
    pobierzBearerZZadania({
      headers: { authorization: `Bearer ${klucz}` }
    }),
    klucz
  );
  assert.equal(
    pobierzBearerZZadania({
      headers: { authorization: `bearer   ${klucz}` }
    }),
    klucz
  );
});

test("odrzuca brak lub inny sposob przekazania tokenu", () => {
  const klucz = generujKluczApi();

  assert.equal(pobierzBearerZZadania({ headers: {} }), null);
  assert.equal(pobierzBearerZZadania({ headers: { token: klucz } }), null);
  assert.equal(
    pobierzBearerZZadania({ headers: { authorization: klucz } }),
    ""
  );
});

test("weryfikuje Bearer jako hash i wymaga aktualnego admina bez 2FA", async () => {
  const klucz = generujKluczApi();
  const poprzednieQuery = pool.query;
  let liczbaZapytan = 0;

  pool.query = async (sql, params) => {
    liczbaZapytan += 1;
    assert.match(sql, /u\.rola = 'admin'/);
    assert.match(sql, /u\.dwuetapowe = FALSE/);
    assert.deepEqual(params, [hashujKluczApi(klucz)]);

    return {
      rows: [{
        id: 7,
        email: "admin@example.com",
        rola: "admin",
        dwuetapowe: false
      }]
    };
  };

  try {
    const wynik = await pobierzAdminaZKluczaApi({
      headers: { authorization: `Bearer ${klucz}` }
    });

    assert.equal(wynik.przekazany, true);
    assert.equal(wynik.uzytkownik.id, 7);
    assert.equal(liczbaZapytan, 1);
  } finally {
    pool.query = poprzednieQuery;
  }
});

test("normalizuje i hashuje klucz bez przechowywania jego jawnej wartosci", () => {
  const klucz = generujKluczApi();
  const hash = hashujKluczApi(klucz);

  assert.equal(normalizujKluczApi(`  ${klucz}  `), klucz);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hashujKluczApi(klucz), hash);
  assert.notEqual(hash, klucz);
});
