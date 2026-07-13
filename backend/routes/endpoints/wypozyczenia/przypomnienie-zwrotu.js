import { Router } from "express";
import { mailPrzypomnienieOZwrocie } from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  pobierzOpcjeZBody,
  policzDniDoDaty
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

    if (dane.status !== "aktywny") {
      return res.status(409).json({
        error: "Przypomnienie o zwrocie mozna wyslac tylko dla aktywnego wypozyczenia."
      });
    }

    if (new Date(dane.data_do).getTime() < Date.now()) {
      return res.status(409).json({
        error: "Termin zwrotu juz minal. Uzyj przypomnienia o przeterminowanym zwrocie."
      });
    }

    const mail = await wyslijMailWypozyczenia(dane, (daneMaila) =>
      mailPrzypomnienieOZwrocie({
        ...daneMaila,
        dniDoZwrotu: policzDniDoDaty(dane.data_do),
        miejsceZwrotu: pobierzOpcjeZBody(
          req.body,
          ["miejsce_zwrotu", "miejsceZwrotu"],
          "MAIL_RETURN_LOCATION"
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
