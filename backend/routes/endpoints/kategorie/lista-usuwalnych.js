import { Router } from "express";
import { pool } from "../../../db/pool.js";

const router = Router();

router.get("/", async (req, res) => {
  const result = await pool.query(
    `
    SELECT id
    FROM kategorie k
    WHERE NOT EXISTS (
      SELECT 1
      FROM sprzety s
      WHERE s.kategoria_id = k.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM promocje_kategorie pk
      WHERE pk.kategoria_id = k.id
    )
    ORDER BY id;
    `
  );

  const dane = result.rows.map((kategoria) => kategoria.id);

  return res.status(200).json(dane);
});

export default router;
