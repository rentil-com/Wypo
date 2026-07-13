import { Router } from "express";
import { LIMIT_RECENZJI_NA_STRONE } from "../../../helpers/constants.js";
import { parsujIdRecenzji } from "../../../helpers/recenzje.js";
import { pobierzListeRecenzji } from "../../../services/recenzje.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const strona = parsujIdRecenzji(req.query.strona) || 1;
    const where = [
      "r.uzytkownik_id = $1",
      "r.status = 'aktywna'::status_recenzji"
    ];
    const params = [req.uzytkownik.id];
    const lista = await pobierzListeRecenzji(where, params, strona);

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone: LIMIT_RECENZJI_NA_STRONE,
      total: lista.total,
      liczbaStron: lista.liczbaStron,
      dane: lista.dane
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
