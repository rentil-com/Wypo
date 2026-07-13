import { Router } from "express";
import { mapujRecenzje, parsujIdRecenzji } from "../../../helpers/recenzje.js";
import {
  pobierzRecenzjePoId,
  ustawStatusRecenzji
} from "../../../services/recenzje.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  try {
    const id = parsujIdRecenzji(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID recenzji."
      });
    }

    const recenzja = await pobierzRecenzjePoId(id);

    if (!recenzja || recenzja.status === "usunieta") {
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

    const usunietaRecenzja = await ustawStatusRecenzji(id, "usunieta");

    return res.status(200).json(mapujRecenzje(usunietaRecenzja));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
