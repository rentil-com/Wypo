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
const DOZWOLONE_POLA = new Set(["sprzet_id", "data_od", "data_do"]);

router.post("/", async (req, res) => {
  const client = await pool.connect();
  let transakcjaAktywna = false;

  try {
    if (Object.keys(req.body || {}).some((pole) => !DOZWOLONE_POLA.has(pole))) {
      return res.status(400).json({
        error: "Body zawiera nieobslugiwane pola wypozyczenia."
      });
    }

    const sprzetId = parsujId(req.body?.sprzet_id);
    const dataOd = parsujDate(req.body?.data_od);
    const dataDo = parsujDate(req.body?.data_do);

    if (!sprzetId || !dataOd || !dataDo || dataDo < dataOd) {
      return res.status(400).json({
        error: "Nieprawidlowe dane wypozyczenia."
      });
    }

    await client.query("BEGIN");
    transakcjaAktywna = true;

    const sprzet = await pobierzSprzetDoAktualizacji(
      client,
      sprzetId,
      req.uzytkownik.id
    );

    if (!sprzet) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    if (sprzet.status !== "dostepny") {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(409).json({
        error: "Sprzet nie jest dostepny."
      });
    }

    const maPromocje = sprzet.promocja_id !== null;
    const result = await client.query(
      `
      INSERT INTO wypozyczenia (
        sprzet_id,
        uzytkownik_id,
        data_zlozenia,
        data_od,
        data_do,
        status,
        promocja_id,
        cena_bazowa,
        cena_koncowa,
        promocja_nazwa,
        promocja_typ,
        promocja_wartosc
      )
      VALUES (
        $1,
        $2,
        CURRENT_TIMESTAMP,
        $3,
        $4,
        'oczekujacy',
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      RETURNING
        id,
        sprzet_id,
        uzytkownik_id,
        data_zlozenia,
        data_od,
        data_do,
        status,
        data_zwrotu_rzeczywista,
        promocja_id,
        cena_bazowa,
        cena_koncowa,
        promocja_nazwa,
        promocja_typ,
        promocja_wartosc;
      `,
      [
        sprzetId,
        req.uzytkownik.id,
        dataOd,
        dataDo,
        maPromocje ? sprzet.promocja_id : null,
        sprzet.cena,
        sprzet.cena_aktualna,
        maPromocje ? sprzet.promocja_nazwa : null,
        maPromocje ? sprzet.promocja_typ : null,
        maPromocje ? sprzet.promocja_wartosc : null
      ]
    );

    await client.query("COMMIT");
    transakcjaAktywna = false;

    wyslijMailWypozyczeniaWTle(
      result.rows[0].id,
      mailPotwierdzenieZapytaniaWypozyczenia,
      "potwierdzenie zapytania o wypozyczenie"
    );

    return res.status(201).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    if (transakcjaAktywna) {
      await client.query("ROLLBACK").catch(console.error);
    }

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
