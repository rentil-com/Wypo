import { normalizujTekst } from "./common.js";

export const DOZWOLONE_ROLE = ["uzytkownik", "admin"];

export function czyPoprawnyEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function czyPoprawneHaslo(haslo) {
  return typeof haslo === "string" &&
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(haslo);
}

export function mapujKonto(konto) {
  return {
    id: konto.id,
    imie: konto.imie,
    nazwisko: konto.nazwisko,
    email: konto.email,
    rola: konto.rola,
    dwuetapowe: konto.dwuetapowe,
    data_utworzenia: konto.data_utworzenia
  };
}

export function dodajFiltryKont(query, where, params) {
  const imie = normalizujTekst(query.imie);
  const nazwisko = normalizujTekst(query.nazwisko);
  const email = normalizujTekst(query.email);
  const rola = normalizujTekst(query.rola);

  if (imie) {
    params.push(`%${imie}%`);
    where.push(`imie ILIKE $${params.length}`);
  }

  if (nazwisko) {
    params.push(`%${nazwisko}%`);
    where.push(`nazwisko ILIKE $${params.length}`);
  }

  if (email) {
    params.push(`%${email}%`);
    where.push(`email ILIKE $${params.length}`);
  }

  if (DOZWOLONE_ROLE.includes(rola)) {
    params.push(rola);
    where.push(`rola = $${params.length}`);
  }

  return {
    imie: imie || null,
    nazwisko: nazwisko || null,
    email: email || null,
    rola: DOZWOLONE_ROLE.includes(rola) ? rola : null
  };
}
