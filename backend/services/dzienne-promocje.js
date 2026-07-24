import { pobierzDodatniaLiczbeCalkowitaEnv, pobierzListeEnv } from "../helpers/env.js";
import {
  BladPromocji,
  polaPelnejPromocjiSql,
  pobierzPromocjePoId
} from "./promocje.js";

const DOMYSLNE_RABATY_PROCENTOWE = ["5", "10", "15", "20", "25"];
const DOMYSLNA_NAZWA = "Dzienna promocja";
const DOMYSLNY_OPIS = "Indywidualna promocja wylosowana dla uzytkownika.";

function pobierzNazwePromocji() {
  const nazwa = String(
    process.env.DZIENNA_PROMOCJA_NAZWA || DOMYSLNA_NAZWA
  ).trim();

  if (!nazwa || nazwa.length > 100) {
    throw new Error(
      "DZIENNA_PROMOCJA_NAZWA musi zawierac od 1 do 100 znakow."
    );
  }

  return nazwa;
}

function pobierzOpisPromocji() {
  if (process.env.DZIENNA_PROMOCJA_OPIS === undefined) {
    return DOMYSLNY_OPIS;
  }

  const opis = String(process.env.DZIENNA_PROMOCJA_OPIS).trim();
  return opis || null;
}

function pobierzRabatyProcentowe() {
  return pobierzListeEnv(
    "DZIENNA_PROMOCJA_RABATY_PROCENTOWE",
    DOMYSLNE_RABATY_PROCENTOWE
  ).map((element) => {
    const tekst = String(element).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(tekst)) {
      throw new Error(
        "DZIENNA_PROMOCJA_RABATY_PROCENTOWE musi zawierac liczby z maksymalnie dwoma miejscami po kropce."
      );
    }

    const wartosc = Number(tekst);

    if (!Number.isFinite(wartosc) || wartosc <= 0 || wartosc > 100) {
      throw new Error(
        "DZIENNA_PROMOCJA_RABATY_PROCENTOWE musi zawierac wartosci od 0 do 100."
      );
    }

    return wartosc;
  });
}

export function pobierzKonfiguracjeDziennejPromocji() {
  return {
    czasWaznosciGodziny: pobierzDodatniaLiczbeCalkowitaEnv(
      "DZIENNA_PROMOCJA_WAZNOSC_GODZIN",
      24
    ),
    rabatyProcentowe: pobierzRabatyProcentowe(),
    nazwa: pobierzNazwePromocji(),
    opis: pobierzOpisPromocji()
  };
}

export function wylosujRabatProcentowy(
  rabatyProcentowe,
  generatorLosowy = Math.random
) {
  const los = Number(generatorLosowy());

  if (
    !Array.isArray(rabatyProcentowe) ||
    rabatyProcentowe.length === 0 ||
    !Number.isFinite(los) ||
    los < 0 ||
    los >= 1
  ) {
    throw new Error("Nie mozna wylosowac wartosci dziennej promocji.");
  }

  return rabatyProcentowe[Math.floor(los * rabatyProcentowe.length)];
}

function czyPromocjaNadalTrwa(promocja, teraz) {
  if (!promocja?.aktywna) {
    return false;
  }

  if (promocja.data_do === null) {
    return true;
  }

  return new Date(promocja.data_do).getTime() > teraz.getTime();
}

async function pobierzAktualnaDziennaPromocje(client, uzytkownikId) {
  const result = await client.query(
    `
    SELECT ${polaPelnejPromocjiSql("p")}
    FROM promocje p
    JOIN promocje_uzytkownicy dzienny_uzytkownik
      ON dzienny_uzytkownik.promocja_id = p.id
    WHERE dzienny_uzytkownik.uzytkownik_id = $1
      AND p.obejmuje_wszystkie_sprzety = FALSE
      AND p.obejmuje_wszystkich_uzytkownikow = FALSE
      AND p.typ = 'procentowa'
      AND p.data_do IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM promocje_kategorie dzienna_kategoria
        WHERE dzienna_kategoria.promocja_id = p.id
      )
      AND (
        SELECT COUNT(*)
        FROM promocje_sprzety dzienny_sprzet
        WHERE dzienny_sprzet.promocja_id = p.id
      ) = 1
      AND NOT EXISTS (
        SELECT 1
        FROM promocje_uzytkownicy inny_uzytkownik
        WHERE inny_uzytkownik.promocja_id = p.id
          AND inny_uzytkownik.uzytkownik_id <> $1
      )
    ORDER BY p.data_od DESC, p.id DESC
    LIMIT 1;
    `,
    [uzytkownikId]
  );

  return result.rows[0] || null;
}

export async function utworzDziennaPromocje(
  client,
  {
    uzytkownikId,
    utworzonaPrzezId,
    wymusReset = false,
    teraz = new Date(),
    generatorLosowy = Math.random,
    konfiguracja = pobierzKonfiguracjeDziennejPromocji()
  }
) {
  const uzytkownikResult = await client.query(
    "SELECT id FROM uzytkownicy WHERE id = $1 FOR UPDATE;",
    [uzytkownikId]
  );

  if (uzytkownikResult.rows.length === 0) {
    throw new BladPromocji("Nie znaleziono uzytkownika.", 404);
  }

  const aktualna = await pobierzAktualnaDziennaPromocje(
    client,
    uzytkownikId
  );
  const aktualnaNadalTrwa = czyPromocjaNadalTrwa(aktualna, teraz);

  if (aktualnaNadalTrwa && !wymusReset) {
    return {
      utworzona: false,
      promocja: aktualna,
      zastapionaPromocjaId: null
    };
  }

  if (aktualnaNadalTrwa && wymusReset) {
    await client.query(
      "UPDATE promocje SET aktywna = FALSE WHERE id = $1;",
      [aktualna.id]
    );
  }

  const sprzetResult = await client.query(
    `
    SELECT id
    FROM sprzety
    WHERE status = 'dostepny'
    ORDER BY RANDOM()
    LIMIT 1;
    `
  );

  if (sprzetResult.rows.length === 0) {
    throw new BladPromocji(
      "Brak dostepnego sprzetu do objecia dzienna promocja.",
      409
    );
  }

  const sprzetId = Number(sprzetResult.rows[0].id);

  const dataOd = new Date(teraz);
  const dataDo = new Date(
    dataOd.getTime() + konfiguracja.czasWaznosciGodziny * 60 * 60 * 1000
  );

  if (Number.isNaN(dataOd.getTime()) || Number.isNaN(dataDo.getTime())) {
    throw new Error("Nieprawidlowa konfiguracja czasu dziennej promocji.");
  }

  const wartosc = wylosujRabatProcentowy(
    konfiguracja.rabatyProcentowe,
    generatorLosowy
  );
  const promocjaResult = await client.query(
    `
    INSERT INTO promocje (
      nazwa,
      opis,
      typ,
      wartosc,
      obejmuje_wszystkie_sprzety,
      obejmuje_wszystkich_uzytkownikow,
      aktywna,
      data_od,
      data_do,
      utworzona_przez
    )
    VALUES ($1, $2, 'procentowa', $3, FALSE, FALSE, TRUE, $4, $5, $6)
    RETURNING id;
    `,
    [
      konfiguracja.nazwa,
      konfiguracja.opis,
      wartosc,
      dataOd,
      dataDo,
      utworzonaPrzezId
    ]
  );
  const promocjaId = promocjaResult.rows[0].id;

  await client.query(
    `
    INSERT INTO promocje_uzytkownicy (promocja_id, uzytkownik_id)
    VALUES ($1, $2);
    `,
    [promocjaId, uzytkownikId]
  );

  await client.query(
    `
    INSERT INTO promocje_sprzety (promocja_id, sprzet_id)
    VALUES ($1, $2);
    `,
    [promocjaId, sprzetId]
  );

  const promocja = await pobierzPromocjePoId(client, promocjaId);

  return {
    utworzona: true,
    promocja,
    zastapionaPromocjaId: aktualnaNadalTrwa ? Number(aktualna.id) : null
  };
}
