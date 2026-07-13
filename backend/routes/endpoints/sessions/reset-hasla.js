import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { czyPoprawnyEmail } from "../../../helpers/accounts.js";
import {
  generujKod,
  generujTokenWyzwania,
  hashujKod,
  hashujTokenWyzwania,
  KOD_RESETU_HASLA_WAZNY_MINUT,
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail
} from "../../../helpers/zabezpieczenia.js";
import { mailKodResetuHasla } from "../../../mail/formatyMaili.js";
import { wyslijMail } from "../../../mail/wysylkaMaili.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const email = normalizujEmail(req.body?.email);

    if (!email || email.length > 255 || !czyPoprawnyEmail(email)) {
      return res.status(400).json({
        error: "Nieprawidlowy adres e-mail."
      });
    }

    const challenge = generujTokenWyzwania();
    const challengeHash = hashujTokenWyzwania(challenge);
    const result = await pool.query(
      `
      SELECT id, imie, email
      FROM uzytkownicy
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );
    const uzytkownik = result.rows[0];

    if (uzytkownik) {
      const kod = generujKod();
      const kodHash = await hashujKod(kod);
      const dataWygasniecia = new Date(
        Date.now() + KOD_RESETU_HASLA_WAZNY_MINUT * 60 * 1000
      );

      await pool.query(
        `
        INSERT INTO resety_hasla (
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
        [challengeHash, uzytkownik.id, kodHash, dataWygasniecia]
      );

      const mail = mailKodResetuHasla({
        kod,
        imie: uzytkownik.imie,
        waznyMinut: KOD_RESETU_HASLA_WAZNY_MINUT
      });

      try {
        await wyslijMail({ do: uzytkownik.email, ...mail });
      } catch (err) {
        await pool.query(
          "DELETE FROM resety_hasla WHERE challenge_hash = $1",
          [challengeHash]
        ).catch(console.error);
        console.error("Nie udalo sie wyslac kodu resetu hasla:", err);
      }
    }

    return res.status(202).json({
      message: "Jesli konto istnieje, wyslano kod resetu hasla.",
      challenge,
      expires_in: KOD_RESETU_HASLA_WAZNY_MINUT * 60,
      max_attempts: MAKSYMALNA_LICZBA_PROB_KODU
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

export default router;
