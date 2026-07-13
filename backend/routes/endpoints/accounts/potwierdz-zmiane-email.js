import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  hashujTokenWyzwania,
  MAKSYMALNA_LICZBA_PROB_KODU,
  porownajKod
} from "../../../helpers/zabezpieczenia.js";
import { mailEmailZmieniony } from "../../../mail/formatyMaili.js";
import { wyslijPowiadomienieWTle } from "../../../services/powiadomienia.js";
import { hashujTokenSesji } from "../../../services/sessions.js";

const router = Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const challenge = String(
      req.body?.challenge ?? req.body?.wyzwanie ?? ""
    ).trim();
    const kod = String(req.body?.code ?? req.body?.kod ?? "").trim();

    if (!/^[a-f0-9]{64}$/.test(challenge) || !/^\d{6}$/.test(kod)) {
      return res.status(400).json({
        error: "Nieprawidlowe wyzwanie lub kod."
      });
    }

    const challengeHash = hashujTokenWyzwania(challenge);
    const hashBiezacejSesji = hashujTokenSesji(req.cookies.session_id);
    await client.query("BEGIN");
    const result = await client.query(
      `
      SELECT
        z.challenge_hash,
        z.uzytkownik_id,
        z.nowy_email,
        z.kod_hash,
        z.data_wygasniecia,
        z.liczba_prob,
        u.imie,
        u.email AS stary_email
      FROM zmiany_email z
      JOIN uzytkownicy u ON u.id = z.uzytkownik_id
      WHERE z.challenge_hash = $1
        AND z.uzytkownik_id = $2
      FOR UPDATE
      `,
      [challengeHash, req.uzytkownik.id]
    );
    const zmiana = result.rows[0];

    if (!zmiana) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    if (
      new Date(zmiana.data_wygasniecia).getTime() <= Date.now() ||
      zmiana.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query(
        "DELETE FROM zmiany_email WHERE challenge_hash = $1",
        [challengeHash]
      );
      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const czyPoprawnyKod = await porownajKod(kod, zmiana.kod_hash);

    if (!czyPoprawnyKod) {
      if (zmiana.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query(
          "DELETE FROM zmiany_email WHERE challenge_hash = $1",
          [challengeHash]
        );
      } else {
        await client.query(
          "UPDATE zmiany_email SET liczba_prob = liczba_prob + 1 WHERE challenge_hash = $1",
          [challengeHash]
        );
      }

      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    await client.query(
      "UPDATE uzytkownicy SET email = $1 WHERE id = $2",
      [zmiana.nowy_email, zmiana.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM zmiany_email WHERE uzytkownik_id = $1",
      [zmiana.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM resety_hasla WHERE uzytkownik_id = $1",
      [zmiana.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM wyzwania_2fa WHERE uzytkownik_id = $1",
      [zmiana.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM sesje WHERE uzytkownik_id = $1 AND session_hash <> $2",
      [zmiana.uzytkownik_id, hashBiezacejSesji]
    );
    await client.query(
      "DELETE FROM rejestracje_oczekujace WHERE email = $1",
      [zmiana.nowy_email]
    );
    await client.query("COMMIT");

    wyslijPowiadomienieWTle(
      zmiana.stary_email,
      mailEmailZmieniony({
        imie: zmiana.imie,
        nowyEmail: zmiana.nowy_email
      }),
      "potwierdzenie zmiany adresu e-mail"
    );

    return res.status(200).json({
      message: "Adres e-mail zostal zmieniony.",
      email: zmiana.nowy_email
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);

    if (err.code === "23505") {
      return res.status(409).json({
        error: "Konto z tym adresem e-mail juz istnieje."
      });
    }

    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  } finally {
    client.release();
  }
});

export default router;
