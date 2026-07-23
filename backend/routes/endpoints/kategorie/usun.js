import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID kategorii."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM kategorie
      WHERE id = $1
      RETURNING id, nazwa, zdjecie_url;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono kategorii."
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error:
          "Nie mozna usunac kategorii powiazanej ze sprzetem lub promocja."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
