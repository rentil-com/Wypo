import { Router } from "express";
import { mapujRecenzje, parsujIdRecenzji } from "../../../helpers/recenzje.js";
import { pobierzRecenzjePoId } from "../../../services/recenzje.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const id = parsujIdRecenzji(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID recenzji."
      });
    }

    const recenzja = await pobierzRecenzjePoId(id);

    if (!recenzja) {
      return res.status(404).json({
        error: "Nie znaleziono recenzji."
      });
    }

    if (recenzja.status !== "aktywna") {
      if (!req.uzytkownik) {
        return res.status(404).json({
          error: "Nie znaleziono recenzji."
        });
      }

      const czyAdmin = req.uzytkownik.rola === "admin";

      if (!czyAdmin && recenzja.uzytkownik_id !== req.uzytkownik.id) {
        return res.status(403).json({
          error: "Brak uprawnien."
        });
      }
    }

    return res.status(200).json(mapujRecenzje(recenzja));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
