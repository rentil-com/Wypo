import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mapujKonto } from "../../../helpers/accounts.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia
      FROM uzytkownicy
      WHERE id = $1
      LIMIT 1;
      `,
      [req.uzytkownik.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
