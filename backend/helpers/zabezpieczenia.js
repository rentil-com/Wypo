import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

export const KOD_REJESTRACJI_WAZNY_MINUT = 15;
export const KOD_2FA_WAZNY_MINUT = 10;
export const KOD_RESETU_HASLA_WAZNY_MINUT = 15;
export const KOD_ZMIANY_EMAIL_WAZNY_MINUT = 15;
export const MAKSYMALNA_LICZBA_PROB_KODU = 5;

export function normalizujEmail(email) {
  return typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';
}

export function generujKod() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export function generujTokenWyzwania() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashujTokenWyzwania(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashujKod(kod) {
  return bcrypt.hash(kod, 10);
}

export async function porownajKod(kod, kodHash) {
  return bcrypt.compare(kod, kodHash);
}
