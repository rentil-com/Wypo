import { formatujZdjeciaUrl } from "./images.js";
import { mapujSkrotPromocji } from "../services/promocje.js";

export function formatujSpecyfikacje(specyfikacje) {
  if (!Array.isArray(specyfikacje)) {
    return [];
  }

  return specyfikacje.map((specyfikacja) => ({
    id: Number(specyfikacja.id),
    nazwa_specyfikacji: specyfikacja.nazwa_specyfikacji,
    opis_specyfikacji: specyfikacja.opis_specyfikacji,
    emotka_specyfikacji: specyfikacja.emotka_specyfikacji
  }));
}

export function podstawowePolaSprzetuSql(alias = "s") {
  return `
        ${alias}.id,
        ${alias}.nazwa,
        ${alias}.opis,
        ${alias}.kategoria_id,
        ${alias}.status,
        ${alias}.zdjecia_url,
        ${alias}.cena`;
}

export function polaSprzetuSql(alias = "s") {
  return `
        ${podstawowePolaSprzetuSql(alias)},
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', spec.id,
              'nazwa_specyfikacji', spec.nazwa_specyfikacji,
              'opis_specyfikacji', spec.opis_specyfikacji,
              'emotka_specyfikacji', spec.emotka_specyfikacji
            )
          )
          FROM (
            SELECT id, nazwa_specyfikacji, opis_specyfikacji, emotka_specyfikacji
            FROM specyfikacje_sprzetu
            WHERE sprzet_id = ${alias}.id
            ORDER BY kolejnosc, id
          ) spec
        ), '[]'::jsonb) AS specyfikacje`;
}

export function mapujSprzet(sprzet, czyAdmin) {
  const promocja = mapujSkrotPromocji(sprzet);
  const cena = Number(sprzet.cena);
  const cenaAktualna = sprzet.cena_aktualna === undefined
    ? cena
    : Number(sprzet.cena_aktualna);
  const wynik = {
    ...sprzet,
    cena,
    cena_aktualna: cenaAktualna,
    czy_promocja: promocja !== null,
    promocja,
    status: czyAdmin
      ? sprzet.status
      : sprzet.status === "dostepny"
        ? "dostepny"
        : "niedostepny",
    zdjecia_url: formatujZdjeciaUrl(sprzet.zdjecia_url)
  };

  delete wynik.promocja_id;
  delete wynik.promocja_nazwa;
  delete wynik.promocja_typ;
  delete wynik.promocja_wartosc;
  delete wynik.promocja_data_do;

  if (Object.prototype.hasOwnProperty.call(sprzet, "specyfikacje")) {
    wynik.specyfikacje = formatujSpecyfikacje(sprzet.specyfikacje);
  }

  return wynik;
}
