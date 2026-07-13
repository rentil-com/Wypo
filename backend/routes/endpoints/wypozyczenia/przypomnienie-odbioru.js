import { Router } from "express";
import { mailPrzypomnienieOOdbiorze } from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  pobierzOpcjeZBody
} from "../../../helpers/wypozyczenia.js";
import {
  pobierzDaneMailaWypozyczenia,
  wyslijMailWypozyczenia
} from "../../../services/maile-wypozyczen.js";

const router = Router();

router.post("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wypozyczenia."
      });
    }

    const dane = await pobierzDaneMailaWypozyczenia(id);

    if (!dane) {
      return res.status(404).json({
        error: "Nie znaleziono wypozyczenia."
      });
    }

    if (dane.status !== "zaakceptowany") {
      return res.status(409).json({
        error: "Przypomnienie o odbiorze mozna wyslac tylko dla zaakceptowanego wypozyczenia."
      });
    }

    const mail = await wyslijMailWypozyczenia(dane, (daneMaila) =>
      mailPrzypomnienieOOdbiorze({
        ...daneMaila,
        miejsceOdbioru: pobierzOpcjeZBody(
          req.body,
          ["miejsce_odbioru", "miejsceOdbioru"],
          "MAIL_PICKUP_LOCATION"
        ),
        godzinyOdbioru: pobierzOpcjeZBody(
          req.body,
          ["godziny_odbioru", "godzinyOdbioru"],
          "MAIL_PICKUP_HOURS"
        )
      })
    );

    return res.status(200).json({
      message: "Mail wyslany.",
      mail,
      wypozyczenie: mapujWypozyczenie(dane)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Nie udalo sie wyslac maila."
    });
  }
});

export default router;
