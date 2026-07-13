import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import { czyPoprawnyPlikZdjecia, formatujUrlZdjecia } from "../../../helpers/images.js";
import { parsujUrlZdjecia } from "../../../helpers/validation.js";
import { uploadPojedynczegoZdjecia } from "../../../middleware/upload.js";
import {
  dodajZdjecieDoS3,
  FOLDER_ZDJEC_KATEGORII,
  pobierzKluczS3,
  usunZdjecieZS3
} from "../../../services/s3-images.js";

const router = Router();

async function edytujKategorie(req, res) {
  let client = null;
  let zdjecieDodaneDoS3 = null;
  let poprzednieZdjecieDoUsuniecia = null;
  let transakcjaAktywna = false;
  let transakcjaZatwierdzona = false;

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID kategorii."
      });
    }

    const body = req.body || {};
    const pola = [];
    const params = [];
    let nowyKluczZdjecia = null;

    if (czyPolePrzekazane(body, "nazwa")) {
      const nazwa = normalizujTekst(body.nazwa);

      if (!nazwa || nazwa.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowa nazwa kategorii."
        });
      }

      params.push(nazwa);
      pola.push(`nazwa = $${params.length}`);
    }

    if (req.file) {
      if (!czyPoprawnyPlikZdjecia(req.file)) {
        return res.status(400).json({
          error: "Nieprawidlowy plik zdjecia."
        });
      }

      zdjecieDodaneDoS3 = await dodajZdjecieDoS3(
        req.file,
        FOLDER_ZDJEC_KATEGORII
      );
      nowyKluczZdjecia = zdjecieDodaneDoS3;
      params.push(zdjecieDodaneDoS3);
      pola.push(`zdjecie_url = $${params.length}`);
    } else if (czyPolePrzekazane(body, "zdjecie_url")) {
      const zdjecie = parsujUrlZdjecia(body.zdjecie_url);

      if (!zdjecie.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowy URL zdjecia."
        });
      }

      params.push(zdjecie.wartosc);
      pola.push(`zdjecie_url = $${params.length}`);
      nowyKluczZdjecia = pobierzKluczS3(zdjecie.wartosc);
    }

    if (pola.length === 0) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT zdjecie_url
      FROM kategorie
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      if (zdjecieDodaneDoS3) {
        await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
        zdjecieDodaneDoS3 = null;
      }

      return res.status(404).json({
        error: "Nie znaleziono kategorii."
      });
    }

    if (req.file || czyPolePrzekazane(body, "zdjecie_url")) {
      const poprzedniKluczZdjecia = pobierzKluczS3(
        obecnyResult.rows[0].zdjecie_url
      );

      if (
        poprzedniKluczZdjecia &&
        poprzedniKluczZdjecia !== nowyKluczZdjecia
      ) {
        poprzednieZdjecieDoUsuniecia = obecnyResult.rows[0].zdjecie_url;
      }
    }

    params.push(id);

    const result = await client.query(
      `
      UPDATE kategorie
      SET ${pola.join(", ")}
      WHERE id = $${params.length}
      RETURNING id, nazwa, zdjecie_url;
      `,
      params
    );

    await client.query("COMMIT");
    transakcjaAktywna = false;
    transakcjaZatwierdzona = true;

    if (poprzednieZdjecieDoUsuniecia) {
      await usunZdjecieZS3(poprzednieZdjecieDoUsuniecia);
    }

    zdjecieDodaneDoS3 = null;

    return res.status(200).json({
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
}

router.patch("/:id", uploadPojedynczegoZdjecia, edytujKategorie);
router.put("/:id", uploadPojedynczegoZdjecia, edytujKategorie);

export default router;
