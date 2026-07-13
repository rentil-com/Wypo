import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  try {
    const sprzetId = parsujId(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM ulubione
      WHERE uzytkownik_id = $1
        AND sprzet_id = $2
      RETURNING sprzet_id;
      `,
      [req.uzytkownik.id, sprzetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono polubionego sprzetu."
      });
    }

    return res.status(200).json({
      id: sprzetId,
      polubione: false
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
