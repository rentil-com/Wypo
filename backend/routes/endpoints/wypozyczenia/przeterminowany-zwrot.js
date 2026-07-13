import { Router } from "express";
import { mailPrzeterminowanyZwrot } from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  pobierzOpcjeZBody,
  policzDniPoDacie
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
        error: "Mail o przeterminowanym zwrocie mozna wyslac tylko dla aktywnego wypozyczenia."
      });
    }

    if (new Date(dane.data_do).getTime() >= Date.now()) {
      return res.status(409).json({
        error: "Termin zwrotu jeszcze nie minal."
      });
    }

    const mail = await wyslijMailWypozyczenia(dane, (daneMaila) =>
      mailPrzeterminowanyZwrot({
        ...daneMaila,
        dniPoTerminie: policzDniPoDacie(dane.data_do),
        kontakt: pobierzOpcjeZBody(req.body, ["kontakt"], "MAIL_CONTACT")
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
