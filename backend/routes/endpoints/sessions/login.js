import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../db/pool.js";
import { wyslijMail } from "../../../mail/wysylkaMaili.js";
import { mail2FA } from "../../../mail/formatyMaili.js";
import {
  generujKod,
  generujTokenWyzwania,
  hashujKod,
  hashujTokenWyzwania,
  KOD_2FA_WAZNY_MINUT,
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail
} from "../../../helpers/zabezpieczenia.js";
import {
  odpowiedzZalogowano,
  utworzSesje
} from "../../../services/sessions.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const email = normalizujEmail(req.body?.email);
    const password = req.body?.password ?? req.body?.haslo;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Nieprawidlowe zapytanie." });
    }

    const result = await pool.query(
      `
      SELECT haslo_hash, email, id, imie, rola, dwuetapowe
      FROM uzytkownicy
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount < 1) {
      return res.status(401).json({
        error: "Nieprawidlowe haslo lub uzytkownik"
      });
    }

    const user = result.rows[0];
    const czyPoprawne = await bcrypt.compare(password, user.haslo_hash);

    if (!czyPoprawne) {
      return res.status(401).json({
        error: "Nieprawidlowe haslo lub uzytkownik"
      });
    }

    if (!user.dwuetapowe) {
      const tokenSesji = await utworzSesje(pool, user.id);
      return odpowiedzZalogowano(res, tokenSesji, user);
    }

    const kod = generujKod();
    const kodHash = await hashujKod(kod);
    const challenge = generujTokenWyzwania();
    const challengeHash = hashujTokenWyzwania(challenge);
    const dataWygasniecia = new Date(
      Date.now() + KOD_2FA_WAZNY_MINUT * 60 * 1000
    );

    await pool.query(
      `
      INSERT INTO wyzwania_2fa (
        challenge_hash, uzytkownik_id, kod_hash, data_wygasniecia, liczba_prob
      )
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT (uzytkownik_id) DO UPDATE SET
        challenge_hash = EXCLUDED.challenge_hash,
        kod_hash = EXCLUDED.kod_hash,
        data_wygasniecia = EXCLUDED.data_wygasniecia,
        liczba_prob = 0,
        data_utworzenia = NOW()
      `,
      [challengeHash, user.id, kodHash, dataWygasniecia]
    );

    const mail = mail2FA({
      kod,
      imie: user.imie,
      waznyMinut: KOD_2FA_WAZNY_MINUT
    });

    try {
      await wyslijMail({ do: user.email, ...mail });
    } catch (err) {
      await pool.query(
        "DELETE FROM wyzwania_2fa WHERE challenge_hash = $1",
        [challengeHash]
      ).catch(console.error);
      console.error("Nie udalo sie wyslac kodu 2FA:", err);

      return res.status(502).json({
        error: "Nie udalo sie wyslac kodu 2FA. Sprobuj ponownie."
      });
    }

    return res.status(202).json({
      message: "Wyslano kod 2FA.",
      requires_2fa: true,
      challenge,
      expires_in: KOD_2FA_WAZNY_MINUT * 60,
      max_attempts: MAKSYMALNA_LICZBA_PROB_KODU
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

export default router;
