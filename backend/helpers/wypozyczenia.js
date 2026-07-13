import { normalizujTekst } from "./common.js";

export const DOZWOLONE_STATUSY_WYPOZYCZEN = [
  "oczekujacy",
  "zaakceptowany",
  "odrzucony",
  "aktywny",
  "zwrocony"
];
export const STATUSY_BLOKUJACE_SPRZET = ["aktywny"];
export const STATUSY_LISTY_WYPOZYCZEN = DOZWOLONE_STATUSY_WYPOZYCZEN;
const MS_DZIEN = 1000 * 60 * 60 * 24;

export function parsujDate(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    String(wartosc).trim() === ""
  ) {
    return null;
  }

  const data = new Date(wartosc);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function czyStatusBlokujeSprzet(status) {
  return STATUSY_BLOKUJACE_SPRZET.includes(status);
}

export function mapujWypozyczenie(wypozyczenie) {
  return {
    id: wypozyczenie.id,
    sprzet_id: wypozyczenie.sprzet_id,
    uzytkownik_id: wypozyczenie.uzytkownik_id,
    data_zlozenia: wypozyczenie.data_zlozenia,
    data_od: wypozyczenie.data_od,
    data_do: wypozyczenie.data_do,
    status: wypozyczenie.status,
    data_zwrotu_rzeczywista: wypozyczenie.data_zwrotu_rzeczywista
  };
}

export function parsujDecyzje(wartosc) {
  const decyzja = normalizujTekst(wartosc).toLowerCase();

  if (
    [
      "zaakceptuj",
      "akceptuj",
      "accept",
      "accepted",
      "zaakceptowany"
    ].includes(decyzja)
  ) {
    return "zaakceptowany";
  }

  if (
    ["odrzuc", "odrzucenie", "reject", "rejected", "odrzucony"].includes(
      decyzja
    )
  ) {
    return "odrzucony";
  }

  return null;
}

export function pobierzOpcjeZBody(body, nazwy, envName) {
  for (const nazwa of nazwy) {
    const wartosc = normalizujTekst(body?.[nazwa]);

    if (wartosc) {
      return wartosc;
    }
  }

  return process.env[envName] || "";
}

export function policzDniDoDaty(data) {
  const roznica = new Date(data).getTime() - Date.now();
  return Math.max(0, Math.ceil(roznica / MS_DZIEN));
}

export function policzDniPoDacie(data) {
  const roznica = Date.now() - new Date(data).getTime();
  return Math.max(1, Math.floor(roznica / MS_DZIEN));
}
