import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../db/pool.js";
import {
  BCRYPT_KOSZT_HASLA,
  generujKod,
  hashujKod,
  KOD_REJESTRACJI_WAZNY_MINUT,
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail
} from "../../../helpers/zabezpieczenia.js";
import { wyslijMail } from "../../../mail/wysylkaMaili.js";
import { mailKodRejestracji } from "../../../mail/formatyMaili.js";
import { normalizujTekst } from "../../../helpers/common.js";
import {
  czyPoprawneHaslo,
  czyPoprawnyEmail
} from "../../../helpers/accounts.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { imie, nazwisko, email, password, haslo } = req.body || {};
    const hasloKonta = password || haslo;
    const imieKonta = normalizujTekst(imie);
    const nazwiskoKonta = normalizujTekst(nazwisko);
    const emailKonta = normalizujEmail(email);

    if (!emailKonta || !hasloKonta || !imieKonta || !nazwiskoKonta) {
      return res.status(400).json({
        error: "Nieprawidlowe zapytanie."
      });
    }

    if (
      emailKonta.length > 255 ||
      imieKonta.length > 100 ||
      nazwiskoKonta.length > 100 ||
      !czyPoprawnyEmail(emailKonta)
    ) {
      return res.status(400).json({
        error: "Nieprawidlowe dane konta."
      });
    }

    if (!czyPoprawneHaslo(hasloKonta)) {
      return res.status(400).json({
        error: "Haslo musi miec minimum 8 znakow, jedna duza litere, jedna mala litere i jeden znak specjalny."
      });
    }

    const result = await pool.query(
      `
      SELECT email
      FROM uzytkownicy
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [emailKonta]
    );

    if (result.rowCount > 0) {
      return res.status(409).json({
        error: "Podany email jest juz w bazie."
      });
    }

    const hasloHash = await bcrypt.hash(hasloKonta, BCRYPT_KOSZT_HASLA);
    const kod = generujKod();
    const kodHash = await hashujKod(kod);
    const dataWygasniecia = new Date(
      Date.now() + KOD_REJESTRACJI_WAZNY_MINUT * 60 * 1000
    );

    await pool.query(
      `
      INSERT INTO rejestracje_oczekujace (
        email,
        imie,
        nazwisko,
        haslo_hash,
        kod_hash,
        data_wygasniecia,
        liczba_prob
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0)
      ON CONFLICT (email) DO UPDATE SET
        imie = EXCLUDED.imie,
        nazwisko = EXCLUDED.nazwisko,
        haslo_hash = EXCLUDED.haslo_hash,
        kod_hash = EXCLUDED.kod_hash,
        data_wygasniecia = EXCLUDED.data_wygasniecia,
        liczba_prob = 0,
        data_utworzenia = NOW()
      `,
      [
        emailKonta,
        imieKonta,
        nazwiskoKonta,
        hasloHash,
        kodHash,
        dataWygasniecia
      ]
    );

    const mail = mailKodRejestracji({
      kod,
      imie: imieKonta,
      waznyMinut: KOD_REJESTRACJI_WAZNY_MINUT
    });

    try {
      await wyslijMail({
        do: emailKonta,
        ...mail
      });
    } catch (err) {
      console.error("Nie udalo sie wyslac kodu rejestracji:", err);

      return res.status(502).json({
        error: "Nie udalo sie wyslac kodu rejestracji. Sprobuj ponownie."
      });
    }

    return res.status(202).json({
      message: "Wyslano kod potwierdzajacy. Konto nie zostalo jeszcze utworzone.",
      expires_in: KOD_REJESTRACJI_WAZNY_MINUT * 60,
      max_attempts: MAKSYMALNA_LICZBA_PROB_KODU
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
