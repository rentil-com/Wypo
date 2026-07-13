import { Router } from "express";
import { mapujRecenzje, parsujIdRecenzji } from "../../../helpers/recenzje.js";
import {
  pobierzRecenzjePoId,
  ustawStatusRecenzji
} from "../../../services/recenzje.js";

const router = Router();

async function odkryjRecenzje(req, res) {
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

    if (recenzja.status === "usunieta") {
      return res.status(400).json({
        error: "Nie mozna zmienic widocznosci usunietej recenzji."
      });
    }

    const zaktualizowanaRecenzja = await ustawStatusRecenzji(id, "aktywna");

    return res.status(200).json(mapujRecenzje(zaktualizowanaRecenzja));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
}

router.patch("/:id", odkryjRecenzje);
router.put("/:id", odkryjRecenzje);

export default router;
