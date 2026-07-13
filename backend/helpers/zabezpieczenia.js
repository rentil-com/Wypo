import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { pobierzDodatniaLiczbeCalkowitaEnv } from './env.js';

export const KOD_REJESTRACJI_WAZNY_MINUT =
  pobierzDodatniaLiczbeCalkowitaEnv('KOD_REJESTRACJI_WAZNY_MINUT', 15);
export const KOD_2FA_WAZNY_MINUT =
  pobierzDodatniaLiczbeCalkowitaEnv('KOD_2FA_WAZNY_MINUT', 10);
export const KOD_RESETU_HASLA_WAZNY_MINUT =
  pobierzDodatniaLiczbeCalkowitaEnv('KOD_RESETU_HASLA_WAZNY_MINUT', 15);
export const KOD_ZMIANY_EMAIL_WAZNY_MINUT =
  pobierzDodatniaLiczbeCalkowitaEnv('KOD_ZMIANY_EMAIL_WAZNY_MINUT', 15);
export const MAKSYMALNA_LICZBA_PROB_KODU =
  pobierzDodatniaLiczbeCalkowitaEnv('MAKSYMALNA_LICZBA_PROB_KODU', 5);
export const DLUGOSC_KODU =
  pobierzDodatniaLiczbeCalkowitaEnv('DLUGOSC_KODU', 6);
export const DLUGOSC_TOKENU_WYZWANIA_BAJTY =
  pobierzDodatniaLiczbeCalkowitaEnv('DLUGOSC_TOKENU_WYZWANIA_BAJTY', 32);
export const BCRYPT_KOSZT_KODU =
  pobierzDodatniaLiczbeCalkowitaEnv('BCRYPT_KOSZT_KODU', 10);
export const BCRYPT_KOSZT_HASLA =
  pobierzDodatniaLiczbeCalkowitaEnv('BCRYPT_KOSZT_HASLA', 12);

export function normalizujEmail(email) {
  return typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';
}

export function generujKod() {
  const maksymalnaWartosc = 10 ** DLUGOSC_KODU;

  if (!Number.isSafeInteger(maksymalnaWartosc)) {
    throw new Error('DLUGOSC_KODU jest zbyt duza.');
  }

  return String(crypto.randomInt(0, maksymalnaWartosc))
    .padStart(DLUGOSC_KODU, '0');
}

export function generujTokenWyzwania() {
  return crypto.randomBytes(DLUGOSC_TOKENU_WYZWANIA_BAJTY).toString('hex');
}

export function hashujTokenWyzwania(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashujKod(kod) {
  return bcrypt.hash(kod, BCRYPT_KOSZT_KODU);
}

export async function porownajKod(kod, kodHash) {
  return bcrypt.compare(kod, kodHash);
}
