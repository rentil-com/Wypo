import { Router } from "express";
import { pool } from "../../../db/pool.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id
      FROM sprzety s
      WHERE NOT EXISTS (
        SELECT 1
        FROM wypozyczenia w
        WHERE w.sprzet_id = s.id
      )
      ORDER BY id;
      `
    );

    const dane = result.rows.map((sprzet) => sprzet.id);
    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
