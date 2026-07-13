import { MAKSYMALNA_CENA } from "./constants.js";
import {
  czyPolePrzekazane,
  czyZwyklyObiekt,
  normalizujTekst,
  normalizujTekstOpcjonalny
} from "./common.js";
import { czyObiektZdjec, uporzadkujZdjeciaUrl } from "./images.js";

export function parsujCene(wartosc, wymagana = false) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    String(wartosc).trim() === ""
  ) {
    return wymagana
      ? { poprawna: false }
      : { poprawna: true, wartosc: null };
  }

  const tekst = String(wartosc).trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(tekst)) {
    return { poprawna: false };
  }

  const cena = Number(tekst);

  if (!Number.isFinite(cena) || cena < 0 || cena > MAKSYMALNA_CENA) {
    return { poprawna: false };
  }

  return { poprawna: true, wartosc: cena };
}

export function parsujFiltrCeny(wartosc) {
  const cena = parsujCene(wartosc);
  return cena.poprawna && cena.wartosc !== null ? cena.wartosc : null;
}

export function parsujBoolean(wartosc) {
  if (typeof wartosc !== "string") {
    return false;
  }

  return ["1", "true", "tak", "yes"].includes(wartosc.trim().toLowerCase());
}

export function parsujUrlZdjecia(wartosc) {
  const url = normalizujTekstOpcjonalny(wartosc);

  if (!url) {
    return { poprawna: true, wartosc: null };
  }

  try {
    const parsed = new URL(url);
    const poprawnyProtokol =
      parsed.protocol === "http:" || parsed.protocol === "https:";

    return poprawnyProtokol
      ? { poprawna: true, wartosc: url }
      : { poprawna: false };
  } catch {
    return { poprawna: false };
  }
}

export function parsujSpecyfikacje(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return { poprawna: true, wartosc: [] };
  }

  let specyfikacje = wartosc;

  if (typeof wartosc === "string") {
    try {
      specyfikacje = JSON.parse(wartosc);
    } catch {
      return { poprawna: false };
    }
  }

  if (!Array.isArray(specyfikacje)) {
    return { poprawna: false };
  }

  const wynik = [];

  for (const specyfikacja of specyfikacje) {
    if (!czyZwyklyObiekt(specyfikacja)) {
      return { poprawna: false };
    }

    const nazwaSpecyfikacji = normalizujTekst(
      specyfikacja.nazwa_specyfikacji
    );
    const opisSpecyfikacji = normalizujTekst(
      specyfikacja.opis_specyfikacji
    );
    const emotkaSpecyfikacji = normalizujTekstOpcjonalny(
      specyfikacja.emotka_specyfikacji
    );

    if (
      !nazwaSpecyfikacji ||
      nazwaSpecyfikacji.length > 100 ||
      !opisSpecyfikacji ||
      (emotkaSpecyfikacji && emotkaSpecyfikacji.length > 100)
    ) {
      return { poprawna: false };
    }

    wynik.push({
      nazwa_specyfikacji: nazwaSpecyfikacji,
      opis_specyfikacji: opisSpecyfikacji,
      emotka_specyfikacji: emotkaSpecyfikacji
    });
  }

  return { poprawna: true, wartosc: wynik };
}

export function pobierzSpecyfikacjeZBody(body) {
  if (czyPolePrzekazane(body, "specyfikacje")) {
    return { przekazane: true, wartosc: body.specyfikacje };
  }

  if (czyPolePrzekazane(body, "specyfikacja")) {
    return { przekazane: true, wartosc: body.specyfikacja };
  }

  return { przekazane: false, wartosc: undefined };
}

export function parsujZdjeciaUrl(wartosc, wymagane = false) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return wymagane
      ? { poprawna: false }
      : { poprawna: true, wartosc: {} };
  }

  let zdjecia = wartosc;

  if (typeof wartosc === "string") {
    try {
      zdjecia = JSON.parse(wartosc);
    } catch {
      return { poprawna: false };
    }
  }

  if (!czyObiektZdjec(zdjecia)) {
    return { poprawna: false };
  }

  const wynik = {};

  for (const [numer, url] of Object.entries(zdjecia)) {
    const numerZdjecia = Number(numer);

    if (
      !Number.isInteger(numerZdjecia) ||
      numerZdjecia <= 0 ||
      String(numerZdjecia) !== String(numer).trim()
    ) {
      return { poprawna: false };
    }

    const urlZdjecia = parsujUrlZdjecia(url);

    if (!urlZdjecia.poprawna || !urlZdjecia.wartosc) {
      return { poprawna: false };
    }

    wynik[String(numerZdjecia)] = urlZdjecia.wartosc;
  }

  if (wymagane && Object.keys(wynik).length === 0) {
    return { poprawna: false };
  }

  return { poprawna: true, wartosc: uporzadkujZdjeciaUrl(wynik) };
}

export function parsujListeUrlZdjec(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return { poprawna: true, wartosc: [] };
  }

  let zdjecia = wartosc;

  if (typeof wartosc === "string") {
    try {
      zdjecia = JSON.parse(wartosc);
    } catch {
      zdjecia = [wartosc];
    }
  }

  if (!Array.isArray(zdjecia)) {
    return { poprawna: false };
  }

  const wynik = [];

  for (const url of zdjecia) {
    const urlZdjecia = parsujUrlZdjecia(url);

    if (!urlZdjecia.poprawna || !urlZdjecia.wartosc) {
      return { poprawna: false };
    }

    wynik.push(urlZdjecia.wartosc);
  }

  return { poprawna: true, wartosc: wynik };
}

export function parsujNumeryZdjec(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return { poprawna: false };
  }

  let dane = wartosc;

  if (typeof wartosc === "string") {
    const tekst = wartosc.trim();

    try {
      dane = JSON.parse(tekst);
    } catch {
      dane = tekst.split(",").map((numer) => numer.trim());
    }
  }

  const numery = czyObiektZdjec(dane)
    ? Object.keys(dane)
    : Array.isArray(dane)
      ? dane
      : [dane];
  const wynik = [];

  for (const numer of numery) {
    const numerZdjecia = Number(numer);

    if (!Number.isInteger(numerZdjecia) || numerZdjecia <= 0) {
      return { poprawna: false };
    }

    const klucz = String(numerZdjecia);

    if (!wynik.includes(klucz)) {
      wynik.push(klucz);
    }
  }

  return wynik.length > 0
    ? { poprawna: true, wartosc: wynik }
    : { poprawna: false };
}
