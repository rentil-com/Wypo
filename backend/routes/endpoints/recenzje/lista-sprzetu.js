import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { LIMIT_RECENZJI_NA_STRONE } from "../../../helpers/constants.js";
import { mapujRecenzje, parsujIdRecenzji } from "../../../helpers/recenzje.js";
import { pobierzSprzetDoRecenzji } from "../../../services/recenzje.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const sprzetId = parsujIdRecenzji(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const sprzet = await pobierzSprzetDoRecenzji(sprzetId);

    if (!sprzet) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const strona = parsujIdRecenzji(req.query.strona) || 1;
    const offset = (strona - 1) * LIMIT_RECENZJI_NA_STRONE;

    const podsumowanieResult = await pool.query(
      `
      SELECT
        COALESCE(AVG(gwiazdki), 0) AS srednia_ocen,
        COUNT(*) AS liczba_recenzji
      FROM recenzje
      WHERE sprzet_id = $1
        AND status = 'aktywna';
      `,
      [sprzetId]
    );

    const liczbaRecenzji = Number(
      podsumowanieResult.rows[0].liczba_recenzji
    );
    const sredniaOcen = Number(
      Number(podsumowanieResult.rows[0].srednia_ocen).toFixed(2)
    );
    const liczbaStron = Math.ceil(
      liczbaRecenzji / LIMIT_RECENZJI_NA_STRONE
    );

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.uzytkownik_id,
        r.sprzet_id,
        r.wypozyczenie_id,
        r.gwiazdki,
        r.tresc,
        r.status,
        r.data_dodania,
        u.imie,
        u.nazwisko
      FROM recenzje r
      JOIN uzytkownicy u
        ON u.id = r.uzytkownik_id
      WHERE r.sprzet_id = $1
        AND r.status = 'aktywna'
      ORDER BY r.data_dodania DESC, r.id DESC
      LIMIT $2 OFFSET $3;
      `,
      [sprzetId, LIMIT_RECENZJI_NA_STRONE, offset]
    );

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone: LIMIT_RECENZJI_NA_STRONE,
      sprzet_id: sprzetId,
      srednia_ocen: sredniaOcen,
      liczba_recenzji: liczbaRecenzji,
      total: liczbaRecenzji,
      liczbaStron,
      dane: result.rows.map(mapujRecenzje)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
