import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujKonto } from "../../../helpers/accounts.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const czyAdmin = req.uzytkownik.rola === "admin";

    if (!czyAdmin && req.uzytkownik.id !== id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    if (czyAdmin && req.uzytkownik.id === id) {
      return res.status(403).json({
        error: "Admin nie moze usunac swojego konta."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM uzytkownicy
      WHERE id = $1
      RETURNING id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "Nie mozna usunac konta, do ktorego przypisane sa wypozyczenia."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
