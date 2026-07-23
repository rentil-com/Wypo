import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujSprzet } from "../../../helpers/items.js";
import { pobierzSprzetZPromocja } from "../../../services/promocje.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const czyAdmin = req.uzytkownik?.rola === "admin";
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const sprzet = await pobierzSprzetZPromocja(
      pool,
      id,
      req.uzytkownik?.id || null,
      { zeSpecyfikacjami: true }
    );

    if (!sprzet) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    return res.status(200).json(mapujSprzet(sprzet, czyAdmin));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
