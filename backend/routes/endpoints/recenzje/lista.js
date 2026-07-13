import { Router } from "express";
import {
  DOZWOLONE_STATUSY_RECENZJI,
  LIMIT_RECENZJI_NA_STRONE
} from "../../../helpers/constants.js";
import {
  czyPolePrzekazane,
  normalizujTekst
} from "../../../helpers/common.js";
import { parsujGwiazdki, parsujIdRecenzji } from "../../../helpers/recenzje.js";
import { pobierzListeRecenzji } from "../../../services/recenzje.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const strona = parsujIdRecenzji(req.query.strona) || 1;
    const where = [];
    const params = [];
    const filtry = {
      uzytkownik_id: null,
      sprzet_id: null,
      status: null,
      gwiazdki: null
    };

    if (czyPolePrzekazane(req.query, "uzytkownik_id")) {
      const uzytkownikId = parsujIdRecenzji(req.query.uzytkownik_id);

      if (!uzytkownikId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID uzytkownika."
        });
      }

      params.push(uzytkownikId);
      where.push(`r.uzytkownik_id = $${params.length}`);
      filtry.uzytkownik_id = uzytkownikId;
    }

    if (czyPolePrzekazane(req.query, "sprzet_id")) {
      const sprzetId = parsujIdRecenzji(req.query.sprzet_id);

      if (!sprzetId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID sprzetu."
        });
      }

      params.push(sprzetId);
      where.push(`r.sprzet_id = $${params.length}`);
      filtry.sprzet_id = sprzetId;
    }

    if (czyPolePrzekazane(req.query, "status")) {
      const status = normalizujTekst(req.query.status);

      if (!DOZWOLONE_STATUSY_RECENZJI.includes(status)) {
        return res.status(400).json({
          error: "Nieprawidlowy status recenzji."
        });
      }

      params.push(status);
      where.push(`r.status = $${params.length}::status_recenzji`);
      filtry.status = status;
    }

    if (czyPolePrzekazane(req.query, "gwiazdki")) {
      const gwiazdki = parsujGwiazdki(req.query.gwiazdki);

      if (!gwiazdki) {
        return res.status(400).json({
          error: "Nieprawidlowa liczba gwiazdek."
        });
      }

      params.push(gwiazdki);
      where.push(`r.gwiazdki = $${params.length}`);
      filtry.gwiazdki = gwiazdki;
    }

    const lista = await pobierzListeRecenzji(where, params, strona);

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone: LIMIT_RECENZJI_NA_STRONE,
      filtry,
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
