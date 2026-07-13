import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujSprzet, polaSprzetuSql } from "../../../helpers/items.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const czyAdmin = req.uzytkownik?.rola === "admin";
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidłowe ID sprzętu."
      });
    }

    const result = await pool.query(
      `
      SELECT ${polaSprzetuSql("s")}
      FROM sprzety s
      WHERE s.id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono sprzętu."
      });
    }

    return res.status(200).json(mapujSprzet(result.rows[0], czyAdmin));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Błąd serwera"
    });
  }
});

export default router;
