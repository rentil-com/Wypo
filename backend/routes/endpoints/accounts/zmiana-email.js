import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../db/pool.js";
import { czyPoprawnyEmail } from "../../../helpers/accounts.js";
import {
  generujKod,
  generujTokenWyzwania,
  hashujKod,
  hashujTokenWyzwania,
  KOD_ZMIANY_EMAIL_WAZNY_MINUT,
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail
} from "../../../helpers/zabezpieczenia.js";
import { mailKodZmianyEmail } from "../../../mail/formatyMaili.js";
import { wyslijMail } from "../../../mail/wysylkaMaili.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const nowyEmail = normalizujEmail(
      req.body?.new_email ?? req.body?.nowy_email ?? req.body?.email
    );
    const haslo = req.body?.password ?? req.body?.haslo;

    if (!nowyEmail || nowyEmail.length > 255 || !czyPoprawnyEmail(nowyEmail)) {
      return res.status(400).json({ error: "Nieprawidlowy nowy adres e-mail." });
    }

    if (nowyEmail === normalizujEmail(req.uzytkownik.email)) {
      return res.status(400).json({
        error: "Nowy adres e-mail musi byc inny od obecnego."
      });
    }

    if (typeof haslo !== "string" || !haslo) {
      return res.status(400).json({ error: "Podaj aktualne haslo." });
    }

    const result = await pool.query(
      `
      SELECT id, imie, haslo_hash
      FROM uzytkownicy
      WHERE id = $1
      LIMIT 1
      `,
      [req.uzytkownik.id]
    );
    const uzytkownik = result.rows[0];

    if (!uzytkownik || !(await bcrypt.compare(haslo, uzytkownik.haslo_hash))) {
      return res.status(401).json({ error: "Nieprawidlowe haslo." });
    }

    const emailResult = await pool.query(
      "SELECT id FROM uzytkownicy WHERE LOWER(email) = $1 LIMIT 1",
      [nowyEmail]
    );

    if (emailResult.rowCount > 0) {
      return res.status(409).json({
        error: "Konto z tym adresem e-mail juz istnieje."
      });
    }

    const kod = generujKod();
    const kodHash = await hashujKod(kod);
    const challenge = generujTokenWyzwania();
    const challengeHash = hashujTokenWyzwania(challenge);
    const dataWygasniecia = new Date(
      Date.now() + KOD_ZMIANY_EMAIL_WAZNY_MINUT * 60 * 1000
    );

    await pool.query(
      "DELETE FROM zmiany_email WHERE data_wygasniecia <= NOW()"
    );

    await pool.query(
      `
      INSERT INTO zmiany_email (
        challenge_hash,
        uzytkownik_id,
        nowy_email,
        kod_hash,
        data_wygasniecia,
        liczba_prob
      )
      VALUES ($1, $2, $3, $4, $5, 0)
      ON CONFLICT (uzytkownik_id) DO UPDATE SET
        challenge_hash = EXCLUDED.challenge_hash,
        nowy_email = EXCLUDED.nowy_email,
        kod_hash = EXCLUDED.kod_hash,
        data_wygasniecia = EXCLUDED.data_wygasniecia,
        liczba_prob = 0,
        data_utworzenia = NOW()
      `,
      [challengeHash, uzytkownik.id, nowyEmail, kodHash, dataWygasniecia]
    );

    const mail = mailKodZmianyEmail({
      kod,
      imie: uzytkownik.imie,
      waznyMinut: KOD_ZMIANY_EMAIL_WAZNY_MINUT
    });

    try {
      await wyslijMail({ do: nowyEmail, ...mail });
    } catch (err) {
      await pool.query(
        "DELETE FROM zmiany_email WHERE challenge_hash = $1",
        [challengeHash]
      ).catch(console.error);
      console.error("Nie udalo sie wyslac kodu zmiany adresu e-mail:", err);

      return res.status(502).json({
        error: "Nie udalo sie wyslac kodu zmiany adresu e-mail. Sprobuj ponownie."
      });
    }

    return res.status(202).json({
      message: "Wyslano kod potwierdzajacy na nowy adres e-mail.",
      challenge,
      expires_in: KOD_ZMIANY_EMAIL_WAZNY_MINUT * 60,
      max_attempts: MAKSYMALNA_LICZBA_PROB_KODU
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Ten adres e-mail jest juz uzywany w innym zleceniu zmiany."
      });
    }

    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

export default router;
