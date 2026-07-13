import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  czyPoprawnePlikiZdjec,
  nastepnyNumerZdjecia,
  plikiZdjec,
  uporzadkujZdjeciaUrl
} from "../../../helpers/images.js";
import { mapujSprzet } from "../../../helpers/items.js";
import { parsujId } from "../../../helpers/common.js";
import { parsujListeUrlZdjec } from "../../../helpers/validation.js";
import { uploadDodawanieZdjec } from "../../../middleware/upload.js";
import { pobierzSprzetPoId } from "../../../services/items.js";
import {
  dodajZdjecieDoS3,
  usunZdjecieZS3
} from "../../../services/s3-images.js";

const router = Router();

router.post("/:id", uploadDodawanieZdjec, async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  const zdjeciaDodaneDoS3 = [];

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const pliki = plikiZdjec(req);
    const zdjeciaZBody = parsujListeUrlZdjec(req.body?.zdjecia_url);

    if (!zdjeciaZBody.poprawna || !czyPoprawnePlikiZdjec(pliki)) {
      return res.status(400).json({
        error: "Nieprawidlowe dane zdjec."
      });
    }

    if (zdjeciaZBody.wartosc.length === 0 && pliki.length === 0) {
      return res.status(400).json({
        error: "Brak zdjec do dodania."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT zdjecia_url
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const zdjeciaUrl = uporzadkujZdjeciaUrl(
      obecnyResult.rows[0].zdjecia_url
    );
    let numerZdjecia = nastepnyNumerZdjecia(zdjeciaUrl);

    for (const url of zdjeciaZBody.wartosc) {
      while (zdjeciaUrl[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjeciaUrl[String(numerZdjecia)] = url;
      numerZdjecia += 1;
    }

    for (const plik of pliki) {
      const klucz = await dodajZdjecieDoS3(plik);
      zdjeciaDodaneDoS3.push(klucz);

      while (zdjeciaUrl[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjeciaUrl[String(numerZdjecia)] = klucz;
      numerZdjecia += 1;
    }

    await client.query(
      `
      UPDATE sprzety
      SET zdjecia_url = $1
      WHERE id = $2;
      `,
      [uporzadkujZdjeciaUrl(zdjeciaUrl), id]
    );

    const sprzet = await pobierzSprzetPoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    for (const zdjecie of zdjeciaDodaneDoS3) {
      await usunZdjecieZS3(zdjecie).catch(console.error);
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
