import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { pobierzIdUlubionych } from "../../../services/ulubione.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const uzytkownikId = parsujId(req.params.id);

    if (!uzytkownikId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const kontoResult = await pool.query(
      `
      SELECT id
      FROM uzytkownicy
      WHERE id = $1
      LIMIT 1;
      `,
      [uzytkownikId]
    );

    if (kontoResult.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    const dane = await pobierzIdUlubionych(uzytkownikId);
    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
