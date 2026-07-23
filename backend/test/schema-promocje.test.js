import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [bazaSql, migracjaPromocjiSql, migracjaSnapshotuSql] = await Promise.all([
  readFile(new URL("../baza.sql", import.meta.url), "utf8"),
  readFile(new URL("../migrations/002_promocje.sql", import.meta.url), "utf8"),
  readFile(
    new URL("../migrations/003_snapshot_ceny_wypozyczenia.sql", import.meta.url),
    "utf8"
  )
]);

function pobierzCheck(sql, nazwa) {
  const indeksNazwy = sql.indexOf(nazwa);
  assert.notEqual(indeksNazwy, -1, `Brak constraintu ${nazwa}.`);

  const indeksCheck = sql.indexOf("CHECK", indeksNazwy);
  const poczatek = sql.indexOf("(", indeksCheck);
  assert.notEqual(poczatek, -1, `Brak CHECK dla ${nazwa}.`);

  let poziom = 0;

  for (let indeks = poczatek; indeks < sql.length; indeks += 1) {
    if (sql[indeks] === "(") {
      poziom += 1;
    } else if (sql[indeks] === ")") {
      poziom -= 1;

      if (poziom === 0) {
        return sql
          .slice(poczatek + 1, indeks)
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  }

  assert.fail(`Niekompletny CHECK dla ${nazwa}.`);
}

function pobierzOnDelete(sql, nazwa) {
  const wzorzec = new RegExp(
    `CONSTRAINT\\s+${nazwa}\\b[\\s\\S]*?ON DELETE\\s+(CASCADE|RESTRICT|SET NULL)`,
    "i"
  );
  const dopasowanie = sql.match(wzorzec);

  assert.ok(dopasowanie, `Brak polityki ON DELETE dla ${nazwa}.`);
  return dopasowanie[1].toUpperCase();
}

test("swiezy schemat ma identyczny constraint snapshotu jak migracja 003", () => {
  const nazwa = "chk_wypozyczenia_snapshot_promocji";

  assert.equal(
    pobierzCheck(bazaSql, nazwa),
    pobierzCheck(migracjaSnapshotuSql, nazwa)
  );
});

test("swiezy i migrowany schemat blokuja usuniecie celow promocji", () => {
  const constraintyCelow = [
    "fk_promocje_kategorie_kategorie",
    "fk_promocje_sprzety_sprzety",
    "fk_promocje_uzytkownicy_uzytkownicy"
  ];

  for (const nazwa of constraintyCelow) {
    assert.equal(pobierzOnDelete(bazaSql, nazwa), "RESTRICT");
    assert.equal(pobierzOnDelete(migracjaPromocjiSql, nazwa), "RESTRICT");
  }
});
