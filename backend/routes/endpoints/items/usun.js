import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujSprzet } from "../../../helpers/items.js";
import { pobierzSprzetPoId } from "../../../services/items.js";
import { usunZdjeciaZS3 } from "../../../services/s3-images.js";

const router = Router();

router.delete("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    await client.query("BEGIN");

    const sprzet = await pobierzSprzetPoId(client, id);

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    await client.query(
      `
      DELETE FROM sprzety
      WHERE id = $1;
      `,
      [id]
    );

    await usunZdjeciaZS3(sprzet.zdjecia_url);
    await client.query("COMMIT");

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23503") {
      return res.status(409).json({
        error:
          "Nie mozna usunac sprzetu powiazanego z wypozyczeniem lub promocja."
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
    client.release();
  }
});

export default router;
