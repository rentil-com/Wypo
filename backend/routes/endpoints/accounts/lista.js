import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import {
  dodajFiltryKont,
  mapujKonto
} from "../../../helpers/accounts.js";
import { LIMIT_KONT_NA_STRONE } from "../../../helpers/constants.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * LIMIT_KONT_NA_STRONE;
    const where = [];
    const whereParams = [];
    const filtry = dodajFiltryKont(req.query, where, whereParams);
    const whereSql = where.length > 0
      ? `WHERE ${where.join(" AND ")}`
      : "";
    const limitIndex = whereParams.length + 1;
    const offsetIndex = whereParams.length + 2;

    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia
      FROM uzytkownicy
      ${whereSql}
      ORDER BY id
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      [...whereParams, LIMIT_KONT_NA_STRONE, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM uzytkownicy
      ${whereSql};
      `,
      whereParams
    );

    const total = Number(countResult.rows[0].total);
    const liczbaStron = Math.ceil(total / LIMIT_KONT_NA_STRONE);

    return res.status(200).json({
      strona,
      limitKontNaStrone: LIMIT_KONT_NA_STRONE,
      filtry,
      total,
      liczbaStron,
      dane: result.rows.map(mapujKonto)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
