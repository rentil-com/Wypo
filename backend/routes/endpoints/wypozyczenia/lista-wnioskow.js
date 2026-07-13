import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  parsujDate,
  STATUSY_LISTY_WYPOZYCZEN
} from "../../../helpers/wypozyczenia.js";
import { LIMIT_WNIOSKOW_NA_STRONE } from "../../../helpers/constants.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * LIMIT_WNIOSKOW_NA_STRONE;
    const where = ["status = ANY($1::status_wypozyczenia[])"];
    const params = [STATUSY_LISTY_WYPOZYCZEN];
    const filtry = {
      uzytkownik_id: null,
      sprzet_id: null,
      data: null,
      status: null
    };

    if (czyPolePrzekazane(req.query, "uzytkownik_id")) {
      const uzytkownikId = parsujId(req.query.uzytkownik_id);

      if (!uzytkownikId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID uzytkownika."
        });
      }

      params.push(uzytkownikId);
      where.push(`uzytkownik_id = $${params.length}`);
      filtry.uzytkownik_id = uzytkownikId;
    }

    const sprzetParam = req.query.sprzet_id ?? req.query.sprzecie_id;

    if (sprzetParam !== undefined) {
      const sprzetId = parsujId(sprzetParam);

      if (!sprzetId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID sprzetu."
        });
      }

      params.push(sprzetId);
      where.push(`sprzet_id = $${params.length}`);
      filtry.sprzet_id = sprzetId;
    }

    if (czyPolePrzekazane(req.query, "status")) {
      const status = normalizujTekst(req.query.status);

      if (!STATUSY_LISTY_WYPOZYCZEN.includes(status)) {
        return res.status(400).json({
          error: "Nieprawidlowy status wniosku."
        });
      }

      params.push(status);
      where.push(`status = $${params.length}::status_wypozyczenia`);
      filtry.status = status;
    }

    if (czyPolePrzekazane(req.query, "data")) {
      const data = parsujDate(req.query.data);

      if (!data) {
        return res.status(400).json({
          error: "Nieprawidlowa data."
        });
      }

      params.push(data);
      where.push(
        `data_od::date <= $${params.length}::date AND data_do::date >= $${params.length}::date`
      );
      filtry.data = req.query.data;
    }

    const whereSql = where.join(" AND ");
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const result = await pool.query(
      `
      SELECT id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista
      FROM wypozyczenia
      WHERE ${whereSql}
      ORDER BY data_zlozenia DESC, id DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      [...params, LIMIT_WNIOSKOW_NA_STRONE, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM wypozyczenia
      WHERE ${whereSql};
      `,
      params
    );

    const total = Number(countResult.rows[0].total);
    const liczbaStron = Math.ceil(total / LIMIT_WNIOSKOW_NA_STRONE);

    return res.status(200).json({
      strona,
      limitWnioskowNaStrone: LIMIT_WNIOSKOW_NA_STRONE,
      filtry,
      total,
      liczbaStron,
      dane: result.rows.map(mapujWypozyczenie)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
