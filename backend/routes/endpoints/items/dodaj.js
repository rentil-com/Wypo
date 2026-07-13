import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { DOZWOLONE_STATUSY } from "../../../helpers/constants.js";
import { normalizujTekst, normalizujTekstOpcjonalny, parsujId } from "../../../helpers/common.js";
import {
  czyPoprawnePlikiZdjec,
  nastepnyNumerZdjecia,
  plikiZdjec
} from "../../../helpers/images.js";
import { mapujSprzet } from "../../../helpers/items.js";
import {
  parsujCene,
  parsujSpecyfikacje,
  parsujZdjeciaUrl
} from "../../../helpers/validation.js";
import { uploadDodawanieSprzetu } from "../../../middleware/upload.js";
import { pobierzSprzetPoId } from "../../../services/items.js";
import {
  dodajZdjecieDoS3,
  usunZdjecieZS3
} from "../../../services/s3-images.js";
import { dodajSpecyfikacjeSprzetu } from "../../../services/specifications.js";

const router = Router();

router.post("/", uploadDodawanieSprzetu, async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  const zdjeciaDodaneDoS3 = [];

  try {
    const nazwa = normalizujTekst(req.body.nazwa);
    const opis = normalizujTekstOpcjonalny(req.body.opis);
    const kategoriaId = parsujId(req.body.kategoria_id);
    const status = req.body.status || "dostepny";
    const cena = parsujCene(req.body.cena, true);
    const cenaPoPromocji = parsujCene(req.body.cena_po_promocji);
    const pliki = plikiZdjec(req);
    const zdjeciaZBody = parsujZdjeciaUrl(req.body.zdjecia_url);
    const zdjeciaUrl = zdjeciaZBody.wartosc || {};
    const specyfikacjeZBody = parsujSpecyfikacje(
      req.body?.specyfikacje ?? req.body?.specyfikacja
    );

    if (
      !nazwa ||
      nazwa.length > 100 ||
      !kategoriaId ||
      !DOZWOLONE_STATUSY.includes(status) ||
      !cena.poprawna ||
      !cenaPoPromocji.poprawna ||
      (cenaPoPromocji.wartosc !== null &&
        cenaPoPromocji.wartosc > cena.wartosc) ||
      !zdjeciaZBody.poprawna ||
      !specyfikacjeZBody.poprawna ||
      !czyPoprawnePlikiZdjec(pliki)
    ) {
      return res.status(400).json({
        error: "Nieprawidlowe dane sprzetu."
      });
    }

    let numerZdjecia = nastepnyNumerZdjecia(zdjeciaUrl);

    for (const plik of pliki) {
      const klucz = await dodajZdjecieDoS3(plik);
      zdjeciaDodaneDoS3.push(klucz);

      while (zdjeciaUrl[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjeciaUrl[String(numerZdjecia)] = klucz;
      numerZdjecia += 1;
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const result = await client.query(
      `
      INSERT INTO sprzety (
        nazwa,
        opis,
        kategoria_id,
        zdjecia_url,
        cena,
        cena_po_promocji,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
      `,
      [
        nazwa,
        opis,
        kategoriaId,
        zdjeciaUrl,
        cena.wartosc,
        cenaPoPromocji.wartosc,
        status
      ]
    );

    await dodajSpecyfikacjeSprzetu(
      client,
      result.rows[0].id,
      specyfikacjeZBody.wartosc
    );

    const sprzet = await pobierzSprzetPoId(client, result.rows[0].id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(201).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    for (const zdjecie of zdjeciaDodaneDoS3) {
      await usunZdjecieZS3(zdjecie).catch(console.error);
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono kategorii."
      });
    }

    if (err.message === "Brak konfiguracji S3.") {
      return res.status(500).json({
        error: "Brak konfiguracji S3."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;
