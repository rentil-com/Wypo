import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujKategorie } from "../../../helpers/kategorie.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parsujId(req.params.id);

  if (!id) {
    return res.status(400).json({
      error: "Nieprawidłowe ID kategorii."
    });
  }

  const result = await pool.query(
    `
    SELECT
      k.id,
      k.nazwa,
      k.zdjecie_url,
      COUNT(s.id) AS liczba_sprzetow,
      COUNT(s.id) FILTER (WHERE s.status = 'dostepny') AS liczba_dostepnych_sprzetow
    FROM kategorie k
    LEFT JOIN sprzety s
      ON s.kategoria_id = k.id
    WHERE k.id = $1
    GROUP BY k.id, k.nazwa, k.zdjecie_url;
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: "Nie znaleziono kategorii."
    });
  }

  return res.status(200).json(mapujKategorie(result.rows[0]));
});

export default router;
