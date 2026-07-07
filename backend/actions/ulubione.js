import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";

const router = Router();

function parsujId(wartosc) {
  const id = Number(wartosc);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function pobierzZalogowanego(req, res) {
  const uzytkownik = await pobierzUzytkownikaZSesji(req);

  if (!uzytkownik) {
    res.status(401).json({
      error: "Wymagane logowanie."
    });

    return null;
  }

  return uzytkownik;
}

async function pobierzIdUlubionych(uzytkownikId) {
  const result = await pool.query(
    `
    SELECT sprzet_id
    FROM ulubione
    WHERE uzytkownik_id = $1
    ORDER BY data_dodania DESC, sprzet_id;
    `,
    [uzytkownikId]
  );

  return result.rows.map((ulubiony) => ulubiony.sprzet_id);
}

router.post("/polub/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const sprzetId = parsujId(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const sprzetResult = await pool.query(
      `
      SELECT id
      FROM sprzety
      WHERE id = $1
      LIMIT 1;
      `,
      [sprzetId]
    );

    if (sprzetResult.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO ulubione (uzytkownik_id, sprzet_id)
      VALUES ($1, $2)
      ON CONFLICT (uzytkownik_id, sprzet_id) DO NOTHING
      RETURNING sprzet_id;
      `,
      [uzytkownik.id, sprzetId]
    );

    return res.status(result.rows.length === 0 ? 200 : 201).json({
      id: sprzetId,
      polubione: true
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.delete("/odlub/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const sprzetId = parsujId(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM ulubione
      WHERE uzytkownik_id = $1
        AND sprzet_id = $2
      RETURNING sprzet_id;
      `,
      [uzytkownik.id, sprzetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono polubionego sprzetu."
      });
    }

    return res.status(200).json({
      id: sprzetId,
      polubione: false
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const dane = await pobierzIdUlubionych(uzytkownik.id);

    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    if (uzytkownik.rola !== "admin") {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const uzytkownikId = parsujId(req.params.id);

    if (!uzytkownikId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const kontoResult = await pool.query(
      `
      SELECT id
      FROM uzytkownicy
      WHERE id = $1
      LIMIT 1;
      `,
      [uzytkownikId]
    );

    if (kontoResult.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    const dane = await pobierzIdUlubionych(uzytkownikId);

    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
