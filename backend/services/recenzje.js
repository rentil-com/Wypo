import { pool } from "../db/pool.js";
import { LIMIT_RECENZJI_NA_STRONE } from "../helpers/constants.js";
import { mapujRecenzje } from "../helpers/recenzje.js";

export async function pobierzSprzetDoRecenzji(sprzetId) {
  const result = await pool.query(
    `
    SELECT id
    FROM sprzety
    WHERE id = $1
    LIMIT 1;
    `,
    [sprzetId]
  );

  return result.rows[0] || null;
}

export async function pobierzRecenzjePoId(id) {
  const result = await pool.query(
    `
    SELECT
      r.id,
      r.uzytkownik_id,
      r.sprzet_id,
      r.wypozyczenie_id,
      r.gwiazdki,
      r.tresc,
      r.status,
      r.data_dodania,
      u.imie,
      u.nazwisko,
      s.nazwa AS nazwa_sprzetu
    FROM recenzje r
    JOIN uzytkownicy u
      ON u.id = r.uzytkownik_id
    JOIN sprzety s
      ON s.id = r.sprzet_id
    WHERE r.id = $1
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function pobierzListeRecenzji(where, params, strona) {
  const offset = (strona - 1) * LIMIT_RECENZJI_NA_STRONE;
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  const result = await pool.query(
    `
    SELECT
      r.id,
      r.uzytkownik_id,
      r.sprzet_id,
      r.wypozyczenie_id,
      r.gwiazdki,
      r.tresc,
      r.status,
      r.data_dodania,
      u.imie,
      u.nazwisko,
      s.nazwa AS nazwa_sprzetu
    FROM recenzje r
    JOIN uzytkownicy u
      ON u.id = r.uzytkownik_id
    JOIN sprzety s
      ON s.id = r.sprzet_id
    ${whereSql}
    ORDER BY r.data_dodania DESC, r.id DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
    `,
    [...params, LIMIT_RECENZJI_NA_STRONE, offset]
  );

  const countResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM recenzje r
    ${whereSql};
    `,
    params
  );

  const total = Number(countResult.rows[0].total);

  return {
    total,
    liczbaStron: Math.ceil(total / LIMIT_RECENZJI_NA_STRONE),
    dane: result.rows.map(mapujRecenzje)
  };
}

export async function pobierzZwroconeWypozyczenie(uzytkownikId, sprzetId) {
  const result = await pool.query(
    `
    SELECT id, status
    FROM wypozyczenia
    WHERE uzytkownik_id = $1
      AND sprzet_id = $2
      AND status = 'zwrocony'
    ORDER BY data_zwrotu_rzeczywista DESC NULLS LAST, id DESC
    LIMIT 1;
    `,
    [uzytkownikId, sprzetId]
  );

  return result.rows[0] || null;
}

export async function pobierzWypozyczenieRecenzji(
  wypozyczenieId,
  uzytkownikId,
  sprzetId
) {
  const result = await pool.query(
    `
    SELECT id, status
    FROM wypozyczenia
    WHERE id = $1
      AND uzytkownik_id = $2
      AND sprzet_id = $3
    LIMIT 1;
    `,
    [wypozyczenieId, uzytkownikId, sprzetId]
  );

  return result.rows[0] || null;
}

export async function pobierzIstniejacaRecenzje(uzytkownikId, sprzetId) {
  const result = await pool.query(
    `
    SELECT id
    FROM recenzje
    WHERE uzytkownik_id = $1
      AND sprzet_id = $2
      AND status != 'usunieta'::status_recenzji
    LIMIT 1;
    `,
    [uzytkownikId, sprzetId]
  );

  return result.rows[0] || null;
}

export async function ustawStatusRecenzji(id, status) {
  const result = await pool.query(
    `
    UPDATE recenzje
    SET status = $2::status_recenzji
    WHERE id = $1
    RETURNING
      id,
      uzytkownik_id,
      sprzet_id,
      wypozyczenie_id,
      gwiazdki,
      tresc,
      status,
      data_dodania;
    `,
    [id, status]
  );

  return result.rows[0] || null;
}
