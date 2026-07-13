import {
  pobierzDodatniaLiczbeCalkowitaEnv,
  pobierzListeEnv
} from "./env.js";

export const LIMIT_PRZEDMIOTOW_NA_STRONE = pobierzDodatniaLiczbeCalkowitaEnv(
  "LIMIT_PRZEDMIOTOW_NA_STRONE",
  20
);
export const LIMIT_WYNIKOW_WYSZUKIWANIA = pobierzDodatniaLiczbeCalkowitaEnv(
  "LIMIT_WYNIKOW_WYSZUKIWANIA",
  5
);
export const LIMIT_KONT_NA_STRONE = pobierzDodatniaLiczbeCalkowitaEnv(
  "LIMIT_KONT_NA_STRONE",
  10
);
export const LIMIT_WNIOSKOW_NA_STRONE = pobierzDodatniaLiczbeCalkowitaEnv(
  "LIMIT_WNIOSKOW_NA_STRONE",
  10
);
export const LIMIT_RECENZJI_NA_STRONE = pobierzDodatniaLiczbeCalkowitaEnv(
  "LIMIT_RECENZJI_NA_STRONE",
  10
);
export const MAKSYMALNA_CENA = 99999999.99;

export const DOZWOLONE_STATUSY = [
  "dostepny",
  "wypozyczony",
  "w_naprawie"
];

export const DOZWOLONE_TYPY_ZDJEC = pobierzListeEnv(
  "DOZWOLONE_TYPY_ZDJEC",
  ["image/jpeg", "image/png", "image/webp", "image/gif"]
);

export const DOZWOLONE_STATUSY_RECENZJI = [
  "aktywna",
  "ukryta",
  "usunieta"
];
