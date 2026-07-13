import { Router } from "express";
import { pool } from "../../../db/pool.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, nazwa, zdjecie_url
      FROM kategorie
      ORDER BY id;
      `
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
