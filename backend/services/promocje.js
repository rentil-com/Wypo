import {
  czyPolePrzekazane,
  czyZwyklyObiekt,
  normalizujTekst,
  normalizujTekstOpcjonalny,
  parsujId
} from "../helpers/common.js";

export const TYPY_PROMOCJI = ["procentowa", "kwotowa"];
export const STANY_PROMOCJI = [
  "zaplanowana",
  "aktywna",
  "wygasla",
  "wylaczona"
];

const POLA_PROMOCJI = [
  "nazwa",
  "opis",
  "typ",
  "wartosc",
  "aktywna",
  "data_od",
  "data_do",
  "zakres_sprzetow",
  "zakres_uzytkownikow"
];

export class BladPromocji extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "BladPromocji";
    this.status = status;
  }
}

export function obliczCenePromocyjna(cena, typ, wartosc) {
  const cenaLiczbowa = Number(cena);
  const wartoscLiczbowa = Number(wartosc);

  if (
    !Number.isFinite(cenaLiczbowa) ||
    !Number.isFinite(wartoscLiczbowa) ||
    !TYPY_PROMOCJI.includes(typ)
  ) {
    return null;
  }

  const wynik = typ === "procentowa"
    ? cenaLiczbowa * (100 - wartoscLiczbowa) / 100
    : Math.max(cenaLiczbowa - wartoscLiczbowa, 0);

  return Math.round((wynik + Number.EPSILON) * 100) / 100;
}

export function promocjaLateralSql({
  sprzetAlias = "s",
  promocjaAlias = "najlepsza_promocja",
  uzytkownikParam = "$1"
} = {}) {
  return `
      LEFT JOIN LATERAL (
        SELECT
          p.id,
          p.nazwa,
          p.typ,
          p.wartosc,
          p.data_do,
          CASE p.typ
            WHEN 'procentowa' THEN
              ROUND(${sprzetAlias}.cena * (100 - p.wartosc) / 100, 2)
            WHEN 'kwotowa' THEN
              GREATEST(${sprzetAlias}.cena - p.wartosc, 0)
          END AS cena_aktualna
        FROM promocje p
        WHERE p.aktywna = TRUE
          AND p.data_od <= CURRENT_TIMESTAMP
          AND (p.data_do IS NULL OR p.data_do > CURRENT_TIMESTAMP)
          AND (
            p.obejmuje_wszystkie_sprzety = TRUE
            OR EXISTS (
              SELECT 1
              FROM promocje_kategorie pk
              WHERE pk.promocja_id = p.id
                AND pk.kategoria_id = ${sprzetAlias}.kategoria_id
            )
            OR EXISTS (
              SELECT 1
              FROM promocje_sprzety ps
              WHERE ps.promocja_id = p.id
                AND ps.sprzet_id = ${sprzetAlias}.id
            )
          )
          AND (
            p.obejmuje_wszystkich_uzytkownikow = TRUE
            OR (
              ${uzytkownikParam}::integer IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM promocje_uzytkownicy pu
                WHERE pu.promocja_id = p.id
                  AND pu.uzytkownik_id = ${uzytkownikParam}::integer
              )
            )
          )
        ORDER BY cena_aktualna ASC, p.id ASC
        LIMIT 1
      ) ${promocjaAlias} ON TRUE`;
}

export function polaPromocjiSprzetuSql(
  sprzetAlias = "s",
  promocjaAlias = "najlepsza_promocja"
) {
  return `
        COALESCE(
          ${promocjaAlias}.cena_aktualna,
          ${sprzetAlias}.cena
        ) AS cena_aktualna,
        ${promocjaAlias}.id AS promocja_id,
        ${promocjaAlias}.nazwa AS promocja_nazwa,
        ${promocjaAlias}.typ AS promocja_typ,
        ${promocjaAlias}.wartosc AS promocja_wartosc,
        ${promocjaAlias}.data_do AS promocja_data_do`;
}

export function mapujSkrotPromocji(wiersz) {
  if (wiersz.promocja_id === null || wiersz.promocja_id === undefined) {
    return null;
  }

  return {
    id: Number(wiersz.promocja_id),
    nazwa: wiersz.promocja_nazwa,
    typ: wiersz.promocja_typ,
    wartosc: Number(wiersz.promocja_wartosc),
    data_do: wiersz.promocja_data_do
  };
}

export function stanPromocjiSql(alias = "p") {
  return `CASE
    WHEN ${alias}.aktywna = FALSE THEN 'wylaczona'
    WHEN ${alias}.data_od > CURRENT_TIMESTAMP THEN 'zaplanowana'
    WHEN ${alias}.data_do IS NOT NULL
      AND ${alias}.data_do <= CURRENT_TIMESTAMP THEN 'wygasla'
    ELSE 'aktywna'
  END`;
}

export function wyliczStanPromocji(promocja, teraz = new Date()) {
  if (!promocja.aktywna) {
    return "wylaczona";
  }

  if (new Date(promocja.data_od).getTime() > teraz.getTime()) {
    return "zaplanowana";
  }

  if (
    promocja.data_do !== null &&
    new Date(promocja.data_do).getTime() <= teraz.getTime()
  ) {
    return "wygasla";
  }

  return "aktywna";
}

function parsujBooleanJson(wartosc) {
  return typeof wartosc === "boolean" ? wartosc : null;
}

function parsujDatePromocji(wartosc, { nullable = false } = {}) {
  if (nullable && wartosc === null) {
    return { poprawna: true, wartosc: null };
  }

  if (
    wartosc === undefined ||
    wartosc === null ||
    String(wartosc).trim() === ""
  ) {
    return { poprawna: false };
  }

  const data = new Date(wartosc);

  return Number.isNaN(data.getTime())
    ? { poprawna: false }
    : { poprawna: true, wartosc: data };
}

function parsujListeId(wartosc) {
  if (!Array.isArray(wartosc)) {
    return null;
  }

  const identyfikatory = [];

  for (const element of wartosc) {
    const id = parsujId(element);

    if (!id) {
      return null;
    }

    if (!identyfikatory.includes(id)) {
      identyfikatory.push(id);
    }
  }

  return identyfikatory;
}

export function parsujZakresSprzetow(wartosc) {
  if (!czyZwyklyObiekt(wartosc)) {
    throw new BladPromocji("Nieprawidlowy zakres sprzetow.");
  }

  const wszystkie = parsujBooleanJson(wartosc.wszystkie);
  const kategorieIds = parsujListeId(wartosc.kategorie_ids);
  const sprzetyIds = parsujListeId(wartosc.sprzety_ids);

  if (
    wszystkie === null ||
    kategorieIds === null ||
    sprzetyIds === null
  ) {
    throw new BladPromocji("Nieprawidlowy zakres sprzetow.");
  }

  if (
    (wszystkie && (kategorieIds.length > 0 || sprzetyIds.length > 0)) ||
    (!wszystkie && kategorieIds.length === 0 && sprzetyIds.length === 0)
  ) {
    throw new BladPromocji("Nieprawidlowy zakres sprzetow.");
  }

  return {
    wszystkie,
    kategorie_ids: kategorieIds,
    sprzety_ids: sprzetyIds
  };
}

export function parsujZakresUzytkownikow(wartosc) {
  if (!czyZwyklyObiekt(wartosc)) {
    throw new BladPromocji("Nieprawidlowy zakres uzytkownikow.");
  }

  const wszyscy = parsujBooleanJson(wartosc.wszyscy);
  const uzytkownicyIds = parsujListeId(wartosc.uzytkownicy_ids);

  if (wszyscy === null || uzytkownicyIds === null) {
    throw new BladPromocji("Nieprawidlowy zakres uzytkownikow.");
  }

  if (
    (wszyscy && uzytkownicyIds.length > 0) ||
    (!wszyscy && uzytkownicyIds.length === 0)
  ) {
    throw new BladPromocji("Nieprawidlowy zakres uzytkownikow.");
  }

  return {
    wszyscy,
    uzytkownicy_ids: uzytkownicyIds
  };
}

export function parsujDanePromocji(body, { czesciowa = false } = {}) {
  if (!czyZwyklyObiekt(body)) {
    throw new BladPromocji("Body musi byc obiektem JSON.");
  }

  const przekazanePola = POLA_PROMOCJI.filter((pole) =>
    czyPolePrzekazane(body, pole)
  );

  if (czesciowa && przekazanePola.length === 0) {
    throw new BladPromocji("Brak danych do aktualizacji.");
  }

  if (
    !czesciowa &&
    !["nazwa", "typ", "wartosc", "zakres_sprzetow", "zakres_uzytkownikow"]
      .every((pole) => czyPolePrzekazane(body, pole))
  ) {
    throw new BladPromocji("Brak wymaganych danych promocji.");
  }

  const dane = {};

  if (czyPolePrzekazane(body, "nazwa")) {
    const nazwa = normalizujTekst(body.nazwa);

    if (!nazwa || nazwa.length > 100) {
      throw new BladPromocji("Nieprawidlowa nazwa promocji.");
    }

    dane.nazwa = nazwa;
  }

  if (czyPolePrzekazane(body, "opis")) {
    dane.opis = normalizujTekstOpcjonalny(body.opis);
  }

  if (czyPolePrzekazane(body, "typ")) {
    const typ = normalizujTekst(body.typ).toLowerCase();

    if (!TYPY_PROMOCJI.includes(typ)) {
      throw new BladPromocji("Nieprawidlowy typ promocji.");
    }

    dane.typ = typ;
  }

  if (czyPolePrzekazane(body, "wartosc")) {
    const tekst = String(body.wartosc).trim().replace(",", ".");

    if (!/^\d+(\.\d{1,2})?$/.test(tekst)) {
      throw new BladPromocji("Nieprawidlowa wartosc promocji.");
    }

    const wartosc = Number(tekst);

    if (!Number.isFinite(wartosc) || wartosc <= 0 || wartosc > 99999999.99) {
      throw new BladPromocji("Nieprawidlowa wartosc promocji.");
    }

    dane.wartosc = wartosc;
  }

  if (czyPolePrzekazane(body, "aktywna")) {
    const aktywna = parsujBooleanJson(body.aktywna);

    if (aktywna === null) {
      throw new BladPromocji("Nieprawidlowa aktywnosc promocji.");
    }

    dane.aktywna = aktywna;
  } else if (!czesciowa) {
    dane.aktywna = true;
  }

  if (czyPolePrzekazane(body, "data_od")) {
    const dataOd = parsujDatePromocji(body.data_od);

    if (!dataOd.poprawna) {
      throw new BladPromocji("Nieprawidlowa data rozpoczecia promocji.");
    }

    dane.data_od = dataOd.wartosc;
  } else if (!czesciowa) {
    dane.data_od = new Date();
  }

  if (czyPolePrzekazane(body, "data_do")) {
    const dataDo = parsujDatePromocji(body.data_do, { nullable: true });

    if (!dataDo.poprawna) {
      throw new BladPromocji("Nieprawidlowa data zakonczenia promocji.");
    }

    dane.data_do = dataDo.wartosc;
  } else if (!czesciowa) {
    dane.data_do = null;
  }

  if (czyPolePrzekazane(body, "zakres_sprzetow")) {
    dane.zakres_sprzetow = parsujZakresSprzetow(body.zakres_sprzetow);
  }

  if (czyPolePrzekazane(body, "zakres_uzytkownikow")) {
    dane.zakres_uzytkownikow = parsujZakresUzytkownikow(
      body.zakres_uzytkownikow
    );
  }

  return dane;
}

export function walidujSpojnoscPromocji(promocja) {
  if (!TYPY_PROMOCJI.includes(promocja.typ)) {
    throw new BladPromocji("Nieprawidlowy typ promocji.");
  }

  const wartosc = Number(promocja.wartosc);

  if (
    !Number.isFinite(wartosc) ||
    wartosc <= 0 ||
    (promocja.typ === "procentowa" && wartosc > 100)
  ) {
    throw new BladPromocji("Nieprawidlowa wartosc promocji.");
  }

  const dataOd = new Date(promocja.data_od);
  const dataDo = promocja.data_do === null
    ? null
    : new Date(promocja.data_do);

  if (
    Number.isNaN(dataOd.getTime()) ||
    (dataDo && (
      Number.isNaN(dataDo.getTime()) ||
      dataDo.getTime() <= dataOd.getTime()
    ))
  ) {
    throw new BladPromocji(
      "Data zakonczenia promocji musi byc pozniejsza od daty rozpoczecia."
    );
  }

  parsujZakresSprzetow(promocja.zakres_sprzetow);
  parsujZakresUzytkownikow(promocja.zakres_uzytkownikow);
}

async function znajdzNieistniejaceId(client, tabela, ids) {
  if (ids.length === 0) {
    return [];
  }

  const result = await client.query(
    `SELECT id FROM ${tabela} WHERE id = ANY($1::integer[]);`,
    [ids]
  );
  const znalezione = new Set(result.rows.map((wiersz) => Number(wiersz.id)));

  return ids.filter((id) => !znalezione.has(id));
}

export async function walidujIstnienieZakresow(
  client,
  zakresSprzetow,
  zakresUzytkownikow
) {
  const brakujaceKategorie = await znajdzNieistniejaceId(
    client,
    "kategorie",
    zakresSprzetow.kategorie_ids
  );
  const brakujaceSprzety = await znajdzNieistniejaceId(
    client,
    "sprzety",
    zakresSprzetow.sprzety_ids
  );
  const brakujacyUzytkownicy = await znajdzNieistniejaceId(
    client,
    "uzytkownicy",
    zakresUzytkownikow.uzytkownicy_ids
  );

  if (
    brakujaceKategorie.length > 0 ||
    brakujaceSprzety.length > 0 ||
    brakujacyUzytkownicy.length > 0
  ) {
    throw new BladPromocji("Zakres promocji zawiera nieistniejace ID.", 404);
  }
}

async function wstawPrzypisania(
  client,
  tabela,
  kolumna,
  promocjaId,
  ids
) {
  if (ids.length === 0) {
    return;
  }

  await client.query(
    `
    INSERT INTO ${tabela} (promocja_id, ${kolumna})
    SELECT $1, UNNEST($2::integer[]);
    `,
    [promocjaId, ids]
  );
}

export async function zapiszZakresyPromocji(
  client,
  promocjaId,
  zakresSprzetow,
  zakresUzytkownikow,
  { zastapSprzety = true, zastapUzytkownikow = true } = {}
) {
  if (zastapSprzety) {
    await client.query(
      "DELETE FROM promocje_kategorie WHERE promocja_id = $1;",
      [promocjaId]
    );
    await client.query(
      "DELETE FROM promocje_sprzety WHERE promocja_id = $1;",
      [promocjaId]
    );
    await wstawPrzypisania(
      client,
      "promocje_kategorie",
      "kategoria_id",
      promocjaId,
      zakresSprzetow.kategorie_ids
    );
    await wstawPrzypisania(
      client,
      "promocje_sprzety",
      "sprzet_id",
      promocjaId,
      zakresSprzetow.sprzety_ids
    );
  }

  if (zastapUzytkownikow) {
    await client.query(
      "DELETE FROM promocje_uzytkownicy WHERE promocja_id = $1;",
      [promocjaId]
    );
    await wstawPrzypisania(
      client,
      "promocje_uzytkownicy",
      "uzytkownik_id",
      promocjaId,
      zakresUzytkownikow.uzytkownicy_ids
    );
  }
}

export function polaPelnejPromocjiSql(alias = "p") {
  return `
    ${alias}.id,
    ${alias}.nazwa,
    ${alias}.opis,
    ${alias}.typ,
    ${alias}.wartosc,
    ${alias}.obejmuje_wszystkie_sprzety,
    ${alias}.obejmuje_wszystkich_uzytkownikow,
    ${alias}.aktywna,
    ${alias}.data_od,
    ${alias}.data_do,
    ${alias}.utworzona_przez,
    ${alias}.data_utworzenia,
    ${stanPromocjiSql(alias)} AS stan,
    ARRAY(
      SELECT pk.kategoria_id
      FROM promocje_kategorie pk
      WHERE pk.promocja_id = ${alias}.id
      ORDER BY pk.kategoria_id
    ) AS kategorie_ids,
    ARRAY(
      SELECT ps.sprzet_id
      FROM promocje_sprzety ps
      WHERE ps.promocja_id = ${alias}.id
      ORDER BY ps.sprzet_id
    ) AS sprzety_ids,
    ARRAY(
      SELECT pu.uzytkownik_id
      FROM promocje_uzytkownicy pu
      WHERE pu.promocja_id = ${alias}.id
      ORDER BY pu.uzytkownik_id
    ) AS uzytkownicy_ids`;
}

export function mapujPromocje(wiersz) {
  return {
    id: Number(wiersz.id),
    nazwa: wiersz.nazwa,
    opis: wiersz.opis,
    typ: wiersz.typ,
    wartosc: Number(wiersz.wartosc),
    aktywna: wiersz.aktywna,
    stan: wiersz.stan || wyliczStanPromocji(wiersz),
    data_od: wiersz.data_od,
    data_do: wiersz.data_do,
    utworzona_przez: Number(wiersz.utworzona_przez),
    data_utworzenia: wiersz.data_utworzenia,
    zakres_sprzetow: {
      wszystkie: wiersz.obejmuje_wszystkie_sprzety,
      kategorie_ids: (wiersz.kategorie_ids || []).map(Number),
      sprzety_ids: (wiersz.sprzety_ids || []).map(Number)
    },
    zakres_uzytkownikow: {
      wszyscy: wiersz.obejmuje_wszystkich_uzytkownikow,
      uzytkownicy_ids: (wiersz.uzytkownicy_ids || []).map(Number)
    }
  };
}

export async function pobierzPromocjePoId(
  client,
  id,
  { blokada = false } = {}
) {
  const result = await client.query(
    `
    SELECT ${polaPelnejPromocjiSql("p")}
    FROM promocje p
    WHERE p.id = $1
    ${blokada ? "FOR UPDATE OF p" : ""};
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function pobierzSprzetZPromocja(
  client,
  id,
  uzytkownikId = null,
  { blokada = false, zeSpecyfikacjami = false } = {}
) {
  const polaSpecyfikacji = zeSpecyfikacjami
    ? `,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', spec.id,
              'nazwa_specyfikacji', spec.nazwa_specyfikacji,
              'opis_specyfikacji', spec.opis_specyfikacji,
              'emotka_specyfikacji', spec.emotka_specyfikacji
            )
          )
          FROM (
            SELECT
              id,
              nazwa_specyfikacji,
              opis_specyfikacji,
              emotka_specyfikacji
            FROM specyfikacje_sprzetu
            WHERE sprzet_id = s.id
            ORDER BY kolejnosc, id
          ) spec
        ), '[]'::jsonb) AS specyfikacje`
    : "";

  const result = await client.query(
    `
    SELECT
      s.id,
      s.nazwa,
      s.opis,
      s.kategoria_id,
      s.status,
      s.zdjecia_url,
      s.cena,
      ${polaPromocjiSprzetuSql("s", "najlepsza_promocja")}
      ${polaSpecyfikacji}
    FROM sprzety s
    ${promocjaLateralSql({
      sprzetAlias: "s",
      promocjaAlias: "najlepsza_promocja",
      uzytkownikParam: "$2"
    })}
    WHERE s.id = $1
    ${blokada ? "FOR UPDATE OF s" : ""};
    `,
    [id, uzytkownikId]
  );

  return result.rows[0] || null;
}
