import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { LIMIT_WNIOSKOW_NA_STRONE } from "../../../helpers/constants.js";
import {
  mapujWypozyczenie,
  polaWypozyczeniaSql
} from "../../../helpers/wypozyczenia.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * LIMIT_WNIOSKOW_NA_STRONE;
    const uzytkownikId = req.uzytkownik.id;

    const result = await pool.query(
      `
      SELECT ${polaWypozyczeniaSql("w")}
      FROM wypozyczenia w
      WHERE w.uzytkownik_id = $1
      ORDER BY w.data_zlozenia DESC, w.id DESC
      LIMIT $2 OFFSET $3;
      `,
      [uzytkownikId, LIMIT_WNIOSKOW_NA_STRONE, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM wypozyczenia
      WHERE uzytkownik_id = $1;
      `,
      [uzytkownikId]
    );

    const total = Number(countResult.rows[0].total);
    const liczbaStron = Math.ceil(total / LIMIT_WNIOSKOW_NA_STRONE);

    return res.status(200).json({
      strona,
      limitWnioskowNaStrone: LIMIT_WNIOSKOW_NA_STRONE,
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
