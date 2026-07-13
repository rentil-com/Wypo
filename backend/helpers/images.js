import { DOZWOLONE_TYPY_ZDJEC } from "./constants.js";
import { czyZwyklyObiekt } from "./common.js";

export function czyObiektZdjec(wartosc) {
  return czyZwyklyObiekt(wartosc);
}

export function uporzadkujZdjeciaUrl(zdjeciaUrl) {
  if (!czyObiektZdjec(zdjeciaUrl)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(zdjeciaUrl).sort(
      ([pierwszy], [drugi]) => Number(pierwszy) - Number(drugi)
    )
  );
}

export function formatujUrlZdjecia(zdjecieUrl) {
  if (!zdjecieUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(zdjecieUrl)) {
    return zdjecieUrl;
  }

  if (!process.env.S3_WEB_ENDPOINT) {
    return zdjecieUrl;
  }

  return `${process.env.S3_WEB_ENDPOINT.replace(/\/+$/, "")}/${zdjecieUrl.replace(
    /^\/+/,
    ""
  )}`;
}

export function formatujZdjeciaUrl(zdjeciaUrl) {
  const zdjecia = uporzadkujZdjeciaUrl(zdjeciaUrl);

  return Object.fromEntries(
    Object.entries(zdjecia).map(([numer, url]) => [
      numer,
      formatujUrlZdjecia(url)
    ])
  );
}

export function pobierzPierwszeZdjecieUrl(zdjeciaUrl) {
  return Object.values(formatujZdjeciaUrl(zdjeciaUrl)).find(Boolean) ?? null;
}

export function nastepnyNumerZdjecia(zdjeciaUrl) {
  const numery = Object.keys(uporzadkujZdjeciaUrl(zdjeciaUrl))
    .map((numer) => Number(numer))
    .filter((numer) => Number.isInteger(numer) && numer > 0);

  return numery.length > 0 ? Math.max(...numery) + 1 : 1;
}

export function plikiZdjec(req) {
  if (req.file) {
    return [req.file];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }

  return [];
}

export function czyPoprawnyPlikZdjecia(plik) {
  return !plik || DOZWOLONE_TYPY_ZDJEC.includes(plik.mimetype);
}

export function czyPoprawnePlikiZdjec(pliki) {
  return pliki.every((plik) => czyPoprawnyPlikZdjecia(plik));
}
