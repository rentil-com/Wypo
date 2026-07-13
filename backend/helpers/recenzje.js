import { czyPolePrzekazane } from "./common.js";


export function parsujIdRecenzji(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    String(wartosc).trim() === ""
  ) {
    return null;
  }

  const tekst = String(wartosc).trim();

  if (!/^\d+$/.test(tekst)) {
    return null;
  }

  const id = Number.parseInt(tekst, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parsujGwiazdki(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    String(wartosc).trim() === ""
  ) {
    return null;
  }

  const tekst = String(wartosc).trim();

  if (!/^\d+$/.test(tekst)) {
    return null;
  }

  const gwiazdki = Number.parseInt(tekst, 10);

  return Number.isInteger(gwiazdki) && gwiazdki >= 1 && gwiazdki <= 5
    ? gwiazdki
    : null;
}

export function mapujRecenzje(recenzja) {
  const wynik = {
    id: recenzja.id,
    uzytkownik_id: recenzja.uzytkownik_id,
    sprzet_id: recenzja.sprzet_id,
    wypozyczenie_id: recenzja.wypozyczenie_id,
    gwiazdki: recenzja.gwiazdki,
    tresc: recenzja.tresc,
    status: recenzja.status,
    data_dodania: recenzja.data_dodania
  };

  if (czyPolePrzekazane(recenzja, "imie")) {
    wynik.imie = recenzja.imie;
    wynik.nazwisko = recenzja.nazwisko;
  }

  if (czyPolePrzekazane(recenzja, "nazwa_sprzetu")) {
    wynik.nazwa_sprzetu = recenzja.nazwa_sprzetu;
  }

  return wynik;
}
