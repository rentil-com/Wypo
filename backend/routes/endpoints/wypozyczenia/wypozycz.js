import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mailPotwierdzenieZapytaniaWypozyczenia } from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  parsujDate
} from "../../../helpers/wypozyczenia.js";
import { pobierzSprzetDoAktualizacji } from "../../../services/wypozyczenia.js";
import { wyslijMailWypozyczeniaWTle } from "../../../services/maile-wypozyczen.js";

const router = Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const sprzetId = parsujId(req.body?.sprzet_id);
    const dataOd = parsujDate(req.body?.data_od);
    const dataDo = parsujDate(req.body?.data_do);

    if (!sprzetId || !dataOd || !dataDo || dataDo < dataOd) {
      return res.status(400).json({
        error: "Nieprawidlowe dane wypozyczenia."
      });
    }

    await client.query("BEGIN");

    const sprzet = await pobierzSprzetDoAktualizacji(client, sprzetId);

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    if (sprzet.status !== "dostepny") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Sprzet nie jest dostepny."
      });
    }

    const result = await client.query(
      `
      INSERT INTO wypozyczenia (
        sprzet_id,
        uzytkownik_id,
        data_zlozenia,
        data_od,
        data_do,
        status
      )
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 'oczekujacy')
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [sprzetId, req.uzytkownik.id, dataOd, dataDo]
    );

    await client.query("COMMIT");

    wyslijMailWypozyczeniaWTle(
      result.rows[0].id,
      mailPotwierdzenieZapytaniaWypozyczenia,
      "potwierdzenie zapytania o wypozyczenie"
    );

    return res.status(201).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe daty wypozyczenia."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    client.release();
  }
});

export default router;
