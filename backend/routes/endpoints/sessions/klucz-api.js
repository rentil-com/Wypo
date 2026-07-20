import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  generujKluczApi,
  hashujKluczApi
} from "../../../services/klucze-api.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT data_utworzenia, data_ostatniego_uzycia
      FROM klucze_api
      WHERE uzytkownik_id = $1
      LIMIT 1
      `,
      [req.uzytkownik.id]
    );
    const klucz = result.rows[0];

    return res.status(200).json({
      active: Boolean(klucz),
      can_generate: !req.uzytkownik.dwuetapowe,
      created_at: klucz?.data_utworzenia || null,
      last_used_at: klucz?.data_ostatniego_uzycia || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const kontoResult = await client.query(
      `
      SELECT rola, dwuetapowe
      FROM uzytkownicy
      WHERE id = $1
      FOR UPDATE
      `,
      [req.uzytkownik.id]
    );
    const konto = kontoResult.rows[0];

    if (!konto) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Nie znaleziono konta." });
    }

    if (konto.rola !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Brak uprawnien." });
    }

    if (konto.dwuetapowe) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Klucz API mozna wygenerowac tylko na koncie bez 2FA."
      });
    }

    const kluczApi = generujKluczApi();
    const kluczHash = hashujKluczApi(kluczApi);
    const kluczResult = await client.query(
      `
      INSERT INTO klucze_api (
        uzytkownik_id, klucz_hash, data_utworzenia, data_ostatniego_uzycia
      )
      VALUES ($1, $2, NOW(), NULL)
      ON CONFLICT (uzytkownik_id) DO UPDATE SET
        klucz_hash = EXCLUDED.klucz_hash,
        data_utworzenia = NOW(),
        data_ostatniego_uzycia = NULL
      RETURNING data_utworzenia
      `,
      [req.uzytkownik.id, kluczHash]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Wygenerowano klucz API. Zapisz go, nie bedzie wyswietlony ponownie.",
      api_key: kluczApi,
      created_at: kluczResult.rows[0].data_utworzenia
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  } finally {
    client.release();
  }
});

router.delete("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      "DELETE FROM klucze_api WHERE uzytkownik_id = $1",
      [req.uzytkownik.id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: result.rowCount > 0
        ? "Uniewazniono klucz API."
        : "Klucz API nie byl aktywny.",
      revoked: result.rowCount > 0
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
