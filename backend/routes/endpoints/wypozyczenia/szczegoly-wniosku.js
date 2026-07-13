import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  STATUSY_LISTY_WYPOZYCZEN
} from "../../../helpers/wypozyczenia.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wniosku."
      });
    }

    const result = await pool.query(
      `
      SELECT id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista
      FROM wypozyczenia
      WHERE id = $1
        AND status = ANY($2::status_wypozyczenia[])
      LIMIT 1;
      `,
      [id, STATUSY_LISTY_WYPOZYCZEN]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono wniosku."
      });
    }

    return res.status(200).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
