import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  hashujTokenWyzwania,
  MAKSYMALNA_LICZBA_PROB_KODU,
  porownajKod
} from "../../../helpers/zabezpieczenia.js";
import {
  odpowiedzZalogowano,
  utworzSesje
} from "../../../services/sessions.js";

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
    await client.query("BEGIN");
    const result = await client.query(
      `
      SELECT
        w.challenge_hash,
        w.uzytkownik_id,
        w.kod_hash,
        w.data_wygasniecia,
        w.liczba_prob,
        u.id,
        u.email,
        u.rola
      FROM wyzwania_2fa w
      JOIN uzytkownicy u ON u.id = w.uzytkownik_id
      WHERE w.challenge_hash = $1
        AND u.dwuetapowe = TRUE
      FOR UPDATE
      `,
      [challengeHash]
    );
    const wyzwanie = result.rows[0];

    if (!wyzwanie) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    if (
      new Date(wyzwanie.data_wygasniecia).getTime() <= Date.now() ||
      wyzwanie.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query(
        "DELETE FROM wyzwania_2fa WHERE challenge_hash = $1",
        [challengeHash]
      );
      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const czyPoprawnyKod = await porownajKod(kod, wyzwanie.kod_hash);

    if (!czyPoprawnyKod) {
      if (wyzwanie.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query(
          "DELETE FROM wyzwania_2fa WHERE challenge_hash = $1",
          [challengeHash]
        );
      } else {
        await client.query(
          "UPDATE wyzwania_2fa SET liczba_prob = liczba_prob + 1 WHERE challenge_hash = $1",
          [challengeHash]
        );
      }

      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const tokenSesji = await utworzSesje(client, wyzwanie.uzytkownik_id);
    await client.query(
      "DELETE FROM wyzwania_2fa WHERE uzytkownik_id = $1",
      [wyzwanie.uzytkownik_id]
    );
    await client.query("COMMIT");

    return odpowiedzZalogowano(res, tokenSesji, {
      id: wyzwanie.id,
      email: wyzwanie.email,
      rola: wyzwanie.rola
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
