import { pool } from "../db/pool.js";
import { wyslijMail } from "../mail/wysylkaMaili.js";

function formatujUrlZdjecia(zdjecieUrl) {
  if (!zdjecieUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(zdjecieUrl)) {
    return zdjecieUrl;
  }

  if (!process.env.S3_WEB_ENDPOINT) {
    return zdjecieUrl;
  }

  return `${process.env.S3_WEB_ENDPOINT.replace(/\/+$/, "")}/${String(
    zdjecieUrl
  ).replace(/^\/+/, "")}`;
}

function wybierzZdjecieProduktu(zdjeciaUrl) {
  if (
    !zdjeciaUrl ||
    typeof zdjeciaUrl !== "object" ||
    Array.isArray(zdjeciaUrl)
  ) {
    return null;
  }

  const pierwszeZdjecie = Object.entries(zdjeciaUrl).sort(
    ([pierwszy], [drugi]) => Number(pierwszy) - Number(drugi)
  )[0];

  return pierwszeZdjecie
    ? formatujUrlZdjecia(pierwszeZdjecie[1])
    : null;
}

export async function pobierzDaneMailaWypozyczenia(wypozyczenieId) {
  const result = await pool.query(
    `
    SELECT
      w.id,
      w.sprzet_id,
      w.uzytkownik_id,
      w.data_zlozenia,
      w.data_od,
      w.data_do,
      w.status,
      w.data_zwrotu_rzeczywista,
      u.imie,
      u.email,
      s.nazwa AS nazwa_sprzetu,
      s.zdjecia_url
    FROM wypozyczenia w
    JOIN uzytkownicy u
      ON u.id = w.uzytkownik_id
    JOIN sprzety s
      ON s.id = w.sprzet_id
    WHERE w.id = $1
    LIMIT 1;
    `,
    [wypozyczenieId]
  );

  return result.rows[0] || null;
}

function mapujDaneMailaWypozyczenia(dane) {
  return {
    imie: dane.imie,
    nazwaSprzetu: dane.nazwa_sprzetu,
    zdjecieProduktuUrl: wybierzZdjecieProduktu(dane.zdjecia_url),
    dataOd: dane.data_od,
    dataDo: dane.data_do,
    dataZwrotu: dane.data_zwrotu_rzeczywista,
    wypozyczenieId: dane.id
  };
}

export async function wyslijMailWypozyczenia(dane, zbudujFormat) {
  return wyslijMail({
    do: dane.email,
    ...zbudujFormat(mapujDaneMailaWypozyczenia(dane))
  });
}

export function wyslijMailWypozyczeniaWTle(
  wypozyczenieId,
  zbudujFormat,
  opis
) {
  void (async () => {
    const dane = await pobierzDaneMailaWypozyczenia(wypozyczenieId);

    if (!dane?.email) {
      return;
    }

    await wyslijMailWypozyczenia(dane, zbudujFormat);
  })().catch((err) => {
    console.error(`Nie udalo sie wyslac maila: ${opis}.`, err);
  });
}
