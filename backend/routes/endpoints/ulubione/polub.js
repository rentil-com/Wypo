import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";

const router = Router();

router.post("/:id", async (req, res) => {
  try {
    const sprzetId = parsujId(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const sprzetResult = await pool.query(
      `
      SELECT id
      FROM sprzety
      WHERE id = $1
      LIMIT 1;
      `,
      [sprzetId]
    );

    if (sprzetResult.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO ulubione (uzytkownik_id, sprzet_id)
      VALUES ($1, $2)
      ON CONFLICT (uzytkownik_id, sprzet_id) DO NOTHING
      RETURNING sprzet_id;
      `,
      [req.uzytkownik.id, sprzetId]
    );

    return res.status(result.rows.length === 0 ? 200 : 201).json({
      id: sprzetId,
      polubione: true
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
