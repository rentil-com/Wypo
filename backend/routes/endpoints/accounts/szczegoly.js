import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { dodajFiltryKont, mapujKonto } from "../../../helpers/accounts.js";

const router = Router();

router.get("/:id", async (req, res) => {
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

    const where = ["id = $1"];
    const params = [id];

    if (czyAdmin) {
      dodajFiltryKont(req.query, where, params);
    }

    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia
      FROM uzytkownicy
      WHERE ${where.join(" AND ")}
      LIMIT 1;
      `,
      params
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
