import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mailWlaczono2FA } from "../../../mail/formatyMaili.js";
import { wyslijPowiadomienieWTle } from "../../../services/powiadomienia.js";

const router = Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
      UPDATE uzytkownicy
      SET dwuetapowe = TRUE
      WHERE id = $1 AND dwuetapowe = FALSE
      RETURNING id
      `,
      [req.uzytkownik.id]
    );

    const kluczResult = await client.query(
      "DELETE FROM klucze_api WHERE uzytkownik_id = $1",
      [req.uzytkownik.id]
    );
    await client.query("COMMIT");

    if (result.rowCount > 0) {
      wyslijPowiadomienieWTle(
        req.uzytkownik.email,
        mailWlaczono2FA({ imie: req.uzytkownik.imie }),
        "wlaczenie 2FA"
      );
    }

    return res.status(200).json({
      message: result.rowCount > 0 ? "Wlaczono 2FA." : "2FA jest juz wlaczone.",
      dwuetapowe: true,
      api_key_revoked: kluczResult.rowCount > 0
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  } finally {
    client.release();
  }
});

export default router;
