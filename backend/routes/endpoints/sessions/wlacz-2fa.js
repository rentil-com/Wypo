import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mailWlaczono2FA } from "../../../mail/formatyMaili.js";
import { wyslijPowiadomienieWTle } from "../../../services/powiadomienia.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE uzytkownicy
      SET dwuetapowe = TRUE
      WHERE id = $1 AND dwuetapowe = FALSE
      RETURNING id
      `,
      [req.uzytkownik.id]
    );

    if (result.rowCount > 0) {
      wyslijPowiadomienieWTle(
        req.uzytkownik.email,
        mailWlaczono2FA({ imie: req.uzytkownik.imie }),
        "wlaczenie 2FA"
      );
    }

    return res.status(200).json({
      message: result.rowCount > 0 ? "Wlaczono 2FA." : "2FA jest juz wlaczone.",
      dwuetapowe: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

export default router;
