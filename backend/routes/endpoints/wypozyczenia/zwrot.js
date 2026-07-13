import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mailPotwierdzenieZwrotu } from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import {
  czyStatusBlokujeSprzet,
  mapujWypozyczenie
} from "../../../helpers/wypozyczenia.js";
import {
  odswiezStatusSprzetu,
  pobierzSprzetDoAktualizacji,
  pobierzWypozyczenieDoAktualizacji
} from "../../../services/wypozyczenia.js";
import { wyslijMailWypozyczeniaWTle } from "../../../services/maile-wypozyczen.js";

const router = Router();

async function zwrocWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wypozyczenia."
      });
    }

    await client.query("BEGIN");

    const wypozyczenie = await pobierzWypozyczenieDoAktualizacji(client, id);

    if (!wypozyczenie) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono wypozyczenia."
      });
    }

    if (
      req.uzytkownik.rola !== "admin" &&
      wypozyczenie.uzytkownik_id !== req.uzytkownik.id
    ) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    if (!czyStatusBlokujeSprzet(wypozyczenie.status)) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Mozna zwrocic tylko aktywne wypozyczenie."
      });
    }

    await pobierzSprzetDoAktualizacji(client, wypozyczenie.sprzet_id);

    const result = await client.query(
      `
      UPDATE wypozyczenia
      SET status = 'zwrocony',
          data_zwrotu_rzeczywista = NOW()
      WHERE id = $1
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [id]
    );

    await odswiezStatusSprzetu(client, wypozyczenie.sprzet_id, false);
    await client.query("COMMIT");

    wyslijMailWypozyczeniaWTle(
      result.rows[0].id,
      mailPotwierdzenieZwrotu,
      "potwierdzenie zwrotu wypozyczenia"
    );

    return res.status(200).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    client.release();
  }
}

router.patch("/:id", zwrocWypozyczenie);
router.post("/:id", zwrocWypozyczenie);

export default router;
