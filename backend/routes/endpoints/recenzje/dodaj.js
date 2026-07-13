import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  czyPolePrzekazane,
  normalizujTekstOpcjonalny
} from "../../../helpers/common.js";
import {
  mapujRecenzje,
  parsujGwiazdki,
  parsujIdRecenzji
} from "../../../helpers/recenzje.js";
import {
  pobierzIstniejacaRecenzje,
  pobierzSprzetDoRecenzji,
  pobierzWypozyczenieRecenzji,
  pobierzZwroconeWypozyczenie
} from "../../../services/recenzje.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const uzytkownik = req.uzytkownik;
    const body = req.body || {};
    const sprzetId = parsujIdRecenzji(body.sprzet_id);
    const gwiazdki = parsujGwiazdki(body.gwiazdki);
    const tresc = normalizujTekstOpcjonalny(body.tresc);
    let wypozyczenieId = null;

    if (!sprzetId || !gwiazdki) {
      return res.status(400).json({
        error: "Nieprawidlowe dane recenzji."
      });
    }

    if (
      czyPolePrzekazane(body, "wypozyczenie_id") &&
      body.wypozyczenie_id !== null &&
      String(body.wypozyczenie_id).trim() !== ""
    ) {
      wypozyczenieId = parsujIdRecenzji(body.wypozyczenie_id);

      if (!wypozyczenieId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID wypozyczenia."
        });
      }
    }

    const sprzet = await pobierzSprzetDoRecenzji(sprzetId);

    if (!sprzet) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const istniejacaRecenzja = await pobierzIstniejacaRecenzje(
      uzytkownik.id,
      sprzetId
    );

    if (istniejacaRecenzja) {
      return res.status(409).json({
        error: "Uzytkownik dodal juz recenzje tego sprzetu."
      });
    }

    if (wypozyczenieId) {
      const wypozyczenie = await pobierzWypozyczenieRecenzji(
        wypozyczenieId,
        uzytkownik.id,
        sprzetId
      );

      if (!wypozyczenie) {
        return res.status(404).json({
          error: "Nie znaleziono wypozyczenia dla tego uzytkownika i sprzetu."
        });
      }

      if (wypozyczenie.status !== "zwrocony") {
        return res.status(409).json({
          error: "Recenzje mozna dodac tylko po zwroconym wypozyczeniu."
        });
      }
    } else {
      const zwroconeWypozyczenie = await pobierzZwroconeWypozyczenie(
        uzytkownik.id,
        sprzetId
      );

      if (!zwroconeWypozyczenie) {
        return res.status(409).json({
          error: "Recenzje mozna dodac tylko po zwroconym wypozyczeniu."
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO recenzje (
        uzytkownik_id,
        sprzet_id,
        wypozyczenie_id,
        gwiazdki,
        tresc
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        uzytkownik_id,
        sprzet_id,
        wypozyczenie_id,
        gwiazdki,
        tresc,
        status,
        data_dodania;
      `,
      [uzytkownik.id, sprzetId, wypozyczenieId, gwiazdki, tresc]
    );

    return res.status(201).json(mapujRecenzje(result.rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Uzytkownik dodal juz recenzje tego sprzetu."
      });
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono powiazanych danych."
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe dane recenzji."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
