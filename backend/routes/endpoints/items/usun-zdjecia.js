import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujSprzet } from "../../../helpers/items.js";
import { uporzadkujZdjeciaUrl } from "../../../helpers/images.js";
import { parsujNumeryZdjec } from "../../../helpers/validation.js";
import { pobierzSprzetPoId } from "../../../services/items.js";
import { usunZdjeciaZS3 } from "../../../services/s3-images.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  const zdjeciaDoUsuniecia = {};

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const numeryZdjec = parsujNumeryZdjec(
      req.body?.zdjecia ?? req.body?.zdjecia_url
    );

    if (!numeryZdjec.poprawna) {
      return res.status(400).json({
        error: "Nieprawidlowe numery zdjec."
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

    for (const numer of numeryZdjec.wartosc) {
      if (Object.prototype.hasOwnProperty.call(zdjeciaUrl, numer)) {
        zdjeciaDoUsuniecia[numer] = zdjeciaUrl[numer];
        delete zdjeciaUrl[numer];
      }
    }

    if (Object.keys(zdjeciaDoUsuniecia).length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono zdjec do usuniecia."
      });
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

    await usunZdjeciaZS3(zdjeciaDoUsuniecia);

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
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
