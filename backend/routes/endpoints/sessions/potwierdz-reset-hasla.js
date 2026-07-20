import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../db/pool.js";
import { czyPoprawneHaslo } from "../../../helpers/accounts.js";
import {
  BCRYPT_KOSZT_HASLA,
  hashujTokenWyzwania,
  MAKSYMALNA_LICZBA_PROB_KODU,
  porownajKod
} from "../../../helpers/zabezpieczenia.js";
import { mailHasloZmienione } from "../../../mail/formatyMaili.js";
import { wyslijPowiadomienieWTle } from "../../../services/powiadomienia.js";
import { wyczyscCookieSesji } from "../../../services/sessions.js";

const router = Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const challenge = String(
      req.body?.challenge ?? req.body?.wyzwanie ?? ""
    ).trim();
    const kod = String(req.body?.code ?? req.body?.kod ?? "").trim();
    const haslo = req.body?.password ?? req.body?.haslo;

    if (!/^[a-f0-9]{64}$/.test(challenge) || !/^\d{6}$/.test(kod)) {
      return res.status(400).json({
        error: "Nieprawidlowe wyzwanie lub kod."
      });
    }

    if (!czyPoprawneHaslo(haslo)) {
      return res.status(400).json({
        error: "Haslo musi miec minimum 8 znakow, jedna duza litere, jedna mala litere i jeden znak specjalny."
      });
    }

    const challengeHash = hashujTokenWyzwania(challenge);
    await client.query("BEGIN");
    const result = await client.query(
      `
      SELECT
        r.challenge_hash,
        r.uzytkownik_id,
        r.kod_hash,
        r.data_wygasniecia,
        r.liczba_prob,
        u.imie,
        u.email
      FROM resety_hasla r
      JOIN uzytkownicy u ON u.id = r.uzytkownik_id
      WHERE r.challenge_hash = $1
      FOR UPDATE
      `,
      [challengeHash]
    );
    const reset = result.rows[0];

    if (!reset) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    if (
      new Date(reset.data_wygasniecia).getTime() <= Date.now() ||
      reset.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query(
        "DELETE FROM resety_hasla WHERE challenge_hash = $1",
        [challengeHash]
      );
      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const czyPoprawnyKod = await porownajKod(kod, reset.kod_hash);

    if (!czyPoprawnyKod) {
      if (reset.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query(
          "DELETE FROM resety_hasla WHERE challenge_hash = $1",
          [challengeHash]
        );
      } else {
        await client.query(
          "UPDATE resety_hasla SET liczba_prob = liczba_prob + 1 WHERE challenge_hash = $1",
          [challengeHash]
        );
      }

      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const hasloHash = await bcrypt.hash(haslo, BCRYPT_KOSZT_HASLA);
    await client.query(
      "UPDATE uzytkownicy SET haslo_hash = $1 WHERE id = $2",
      [hasloHash, reset.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM resety_hasla WHERE uzytkownik_id = $1",
      [reset.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM zmiany_email WHERE uzytkownik_id = $1",
      [reset.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM wyzwania_2fa WHERE uzytkownik_id = $1",
      [reset.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM klucze_api WHERE uzytkownik_id = $1",
      [reset.uzytkownik_id]
    );
    await client.query(
      "DELETE FROM sesje WHERE uzytkownik_id = $1",
      [reset.uzytkownik_id]
    );
    await client.query("COMMIT");

    wyczyscCookieSesji(res);
    wyslijPowiadomienieWTle(
      reset.email,
      mailHasloZmienione({ imie: reset.imie }),
      "potwierdzenie zmiany hasla"
    );

    return res.status(200).json({
      message: "Haslo zostalo zmienione. Zaloguj sie ponownie."
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
