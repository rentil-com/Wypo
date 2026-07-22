import crypto from "node:crypto";
import { pool } from "../db/pool.js";

const PREFIX_KLUCZA_API = "wypo_";
const DLUGOSC_KLUCZA_API_BAJTY = 32;
const WZOR_KLUCZA_API = new RegExp(
  `^${PREFIX_KLUCZA_API}[a-f0-9]{${DLUGOSC_KLUCZA_API_BAJTY * 2}}$`
);

export function generujKluczApi() {
  const losowaCzesc = crypto
    .randomBytes(DLUGOSC_KLUCZA_API_BAJTY)
    .toString("hex");

  return `${PREFIX_KLUCZA_API}${losowaCzesc}`;
}

export function normalizujKluczApi(klucz) {
  return typeof klucz === "string" ? klucz.trim() : "";
}

export function czyPoprawnyFormatKluczaApi(klucz) {
  return WZOR_KLUCZA_API.test(klucz);
}

export function hashujKluczApi(klucz) {
  return crypto.createHash("sha256").update(klucz).digest("hex");
}

export function pobierzBearerZZadania(req) {
  const authorization = typeof req.get === "function"
    ? req.get("authorization")
    : req.headers?.authorization;

  if (authorization === undefined) {
    return null;
  }

  if (typeof authorization !== "string") {
    return "";
  }

  const dopasowanie = authorization.match(/^Bearer\s+(\S+)\s*$/i);
  return dopasowanie ? normalizujKluczApi(dopasowanie[1]) : "";
}

export async function pobierzAdminaZKluczaApi(req) {
  const kluczApi = pobierzBearerZZadania(req);

  if (kluczApi === null) {
    return { przekazany: false, uzytkownik: null };
  }

  if (!czyPoprawnyFormatKluczaApi(kluczApi)) {
    return { przekazany: true, uzytkownik: null };
  }

  const result = await pool.query(
    `
    UPDATE klucze_api AS k
    SET data_ostatniego_uzycia = NOW()
    FROM uzytkownicy AS u
    WHERE k.klucz_hash = $1
      AND u.id = k.uzytkownik_id
      AND u.rola = 'admin'
      AND u.dwuetapowe = FALSE
    RETURNING u.id, u.imie, u.nazwisko, u.email, u.rola, u.dwuetapowe
    `,
    [hashujKluczApi(kluczApi)]
  );

  return {
    przekazany: true,
    uzytkownik: result.rows[0] || null
  };
}
