import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  MAKSYMALNA_LICZBA_PROB_KODU,
  normalizujEmail,
  porownajKod
} from "../../../helpers/zabezpieczenia.js";

const router = Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const email = normalizujEmail(req.body?.email);
    const kod = String(req.body?.code ?? req.body?.kod ?? "").trim();

    if (!email || !/^\d{6}$/.test(kod)) {
      return res.status(400).json({ error: "Nieprawidlowy email lub kod." });
    }

    await client.query("BEGIN");
    const result = await client.query(
      `
      SELECT email, imie, nazwisko, haslo_hash, kod_hash, data_wygasniecia, liczba_prob
      FROM rejestracje_oczekujace
      WHERE email = $1
      FOR UPDATE
      `,
      [email]
    );
    const rejestracja = result.rows[0];

    if (!rejestracja) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    if (
      new Date(rejestracja.data_wygasniecia).getTime() <= Date.now() ||
      rejestracja.liczba_prob >= MAKSYMALNA_LICZBA_PROB_KODU
    ) {
      await client.query(
        "DELETE FROM rejestracje_oczekujace WHERE email = $1",
        [email]
      );
      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const czyPoprawnyKod = await porownajKod(kod, rejestracja.kod_hash);

    if (!czyPoprawnyKod) {
      if (rejestracja.liczba_prob + 1 >= MAKSYMALNA_LICZBA_PROB_KODU) {
        await client.query(
          "DELETE FROM rejestracje_oczekujace WHERE email = $1",
          [email]
        );
      } else {
        await client.query(
          "UPDATE rejestracje_oczekujace SET liczba_prob = liczba_prob + 1 WHERE email = $1",
          [email]
        );
      }

      await client.query("COMMIT");
      return res.status(400).json({ error: "Nieprawidlowy lub wygasly kod." });
    }

    const userResult = await client.query(
      `
      INSERT INTO uzytkownicy (imie, nazwisko, email, haslo_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia
      `,
      [
        rejestracja.imie,
        rejestracja.nazwisko,
        rejestracja.email,
        rejestracja.haslo_hash
      ]
    );

    await client.query(
      "DELETE FROM rejestracje_oczekujace WHERE email = $1",
      [email]
    );
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Konto zostalo utworzone.",
      user: userResult.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);

    if (err.code === "23505") {
      await pool.query(
        "DELETE FROM rejestracje_oczekujace WHERE email = $1",
        [normalizujEmail(req.body?.email)]
      ).catch(console.error);

      return res.status(409).json({
        error: "Konto z tym adresem email juz istnieje."
      });
    }

    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  } finally {
    client.release();
  }
});

export default router;
