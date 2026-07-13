import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { normalizujTekst } from "../../../helpers/common.js";
import { czyPoprawnyPlikZdjecia, formatujUrlZdjecia } from "../../../helpers/images.js";
import { parsujUrlZdjecia } from "../../../helpers/validation.js";
import { uploadPojedynczegoZdjecia } from "../../../middleware/upload.js";
import {
  dodajZdjecieDoS3,
  FOLDER_ZDJEC_KATEGORII,
  usunZdjecieZS3
} from "../../../services/s3-images.js";

const router = Router();

router.post("/", uploadPojedynczegoZdjecia, async (req, res) => {
  let client = null;
  let zdjecieDodaneDoS3 = null;
  let transakcjaAktywna = false;
  let transakcjaZatwierdzona = false;

  try {
    const nazwa = normalizujTekst(req.body.nazwa);
    const zdjecie = parsujUrlZdjecia(req.body.zdjecie_url);

    if (
      !nazwa ||
      nazwa.length > 100 ||
      !zdjecie.poprawna ||
      !czyPoprawnyPlikZdjecia(req.file)
    ) {
      return res.status(400).json({
        error: "Nieprawidlowe dane kategorii."
      });
    }

    let zdjecieUrl = zdjecie.wartosc;

    if (req.file) {
      zdjecieDodaneDoS3 = await dodajZdjecieDoS3(
        req.file,
        FOLDER_ZDJEC_KATEGORII
      );
      zdjecieUrl = zdjecieDodaneDoS3;
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const result = await client.query(
      `
      INSERT INTO kategorie (nazwa, zdjecie_url)
      VALUES ($1, $2)
      RETURNING id, nazwa, zdjecie_url;
      `,
      [nazwa, zdjecieUrl]
    );

    await client.query("COMMIT");
    transakcjaAktywna = false;
    transakcjaZatwierdzona = true;
    zdjecieDodaneDoS3 = null;

    return res.status(201).json({
      ...result.rows[0],
      zdjecie_url: formatujUrlZdjecia(result.rows[0].zdjecie_url)
    });
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    if (!transakcjaZatwierdzona && zdjecieDodaneDoS3) {
      await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
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
