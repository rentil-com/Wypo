import { pool } from '../db/pool.js';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";

const router = Router();

const limitKontNaStrone = 10;
const dozwoloneRole = ["uzytkownik", "admin"];

function normalizujTekst(wartosc) {
  return typeof wartosc === "string"
    ? wartosc.trim()
    : "";
}

function parsujId(wartosc) {
  const id = Number(wartosc);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function czyPoprawnyEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function czyPoprawneHaslo(haslo) {
  return typeof haslo === "string"
    && /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(haslo);
}

function mapujKonto(konto) {
  return {
    id: konto.id,
    imie: konto.imie,
    nazwisko: konto.nazwisko,
    email: konto.email,
    rola: konto.rola,
    data_utworzenia: konto.data_utworzenia
  };
}

function dodajFiltryKont(query, where, params) {
  const imie = normalizujTekst(query.imie);
  const nazwisko = normalizujTekst(query.nazwisko);
  const email = normalizujTekst(query.email);
  const rola = normalizujTekst(query.rola);

  if (imie) {
    params.push(`%${imie}%`);
    where.push(`imie ILIKE $${params.length}`);
  }

  if (nazwisko) {
    params.push(`%${nazwisko}%`);
    where.push(`nazwisko ILIKE $${params.length}`);
  }

  if (email) {
    params.push(`%${email}%`);
    where.push(`email ILIKE $${params.length}`);
  }

  if (dozwoloneRole.includes(rola)) {
    params.push(rola);
    where.push(`rola = $${params.length}`);
  }

  return {
    imie: imie || null,
    nazwisko: nazwisko || null,
    email: email || null,
    rola: dozwoloneRole.includes(rola) ? rola : null
  };
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

router.post("/create", async (req, res) => {
  try {
    const { imie, nazwisko, email, password, haslo } = req.body || {};
    const hasloKonta = password || haslo;

    if (!email || !hasloKonta || !imie || !nazwisko) {
      return res.status(400).json({
        error: "Nieprawidlowe zapytanie."
      });
    }

    if (!czyPoprawnyEmail(email)) {
      return res.status(400).json({
        error: "Nieprawidlowy email."
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
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount > 0) {
      return res.status(409).json({
        error: "Podany email jest juz w bazie."
      });
    }

    const hasloHash = await bcrypt.hash(hasloKonta, 12);

    await pool.query(
      `
      INSERT INTO uzytkownicy (imie, nazwisko, email, haslo_hash)
      VALUES ($1, $2, $3, $4)
      `,
      [imie, nazwisko, email, hasloHash]
    );

    return res.status(201).json({
      message: "Zarejestrowano"
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/details/all", async (req, res) => {
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

    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * limitKontNaStrone;
    const where = [];
    const whereParams = [];
    const filtry = dodajFiltryKont(req.query, where, whereParams);
    const whereSql = where.length > 0
      ? `WHERE ${where.join(" AND ")}`
      : "";
    const limitIndex = whereParams.length + 1;
    const offsetIndex = whereParams.length + 2;

    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, data_utworzenia
      FROM uzytkownicy
      ${whereSql}
      ORDER BY id
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      [...whereParams, limitKontNaStrone, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM uzytkownicy
      ${whereSql};
      `,
      whereParams
    );

    const total = Number(countResult.rows[0].total);
    const liczbaStron = Math.ceil(total / limitKontNaStrone);

    return res.status(200).json({
      strona,
      limitKontNaStrone,
      filtry,
      total,
      liczbaStron,
      dane: result.rows.map(mapujKonto)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/details", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, data_utworzenia
      FROM uzytkownicy
      WHERE id = $1
      LIMIT 1;
      `,
      [uzytkownik.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/details/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const czyAdmin = uzytkownik.rola === "admin";

    if (!czyAdmin && uzytkownik.id !== id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const where = ["id = $1"];
    const params = [id];

    if (czyAdmin) {
      dodajFiltryKont(req.query, where, params);
    }

    const result = await pool.query(
      `
      SELECT id, imie, nazwisko, email, rola, data_utworzenia
      FROM uzytkownicy
      WHERE ${where.join(" AND ")}
      LIMIT 1;
      `,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

async function edytujKonto(req, res) {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const czyAdmin = uzytkownik.rola === "admin";

    if (!czyAdmin && uzytkownik.id !== id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const pola = [];
    const params = [];
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "imie")) {
      const imie = normalizujTekst(body.imie);

      if (!imie || imie.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowe imie."
        });
      }

      params.push(imie);
      pola.push(`imie = $${params.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(body, "nazwisko")) {
      const nazwisko = normalizujTekst(body.nazwisko);

      if (!nazwisko || nazwisko.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowe nazwisko."
        });
      }

      params.push(nazwisko);
      pola.push(`nazwisko = $${params.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      const email = normalizujTekst(body.email);

      if (!email || email.length > 255 || !czyPoprawnyEmail(email)) {
        return res.status(400).json({
          error: "Nieprawidlowy email."
        });
      }

      params.push(email);
      pola.push(`email = $${params.length}`);
    }

    const noweHaslo = Object.prototype.hasOwnProperty.call(body, "haslo")
      ? body.haslo
      : body.password;

    if (
      Object.prototype.hasOwnProperty.call(body, "haslo") ||
      Object.prototype.hasOwnProperty.call(body, "password")
    ) {
      const haslo = normalizujTekst(noweHaslo);

      if (haslo.length < 8) {
        return res.status(400).json({
          error: "Haslo musi miec minimum 8 znakow."
        });
      }

      const hasloHash = await bcrypt.hash(haslo, 12);
      params.push(hasloHash);
      pola.push(`haslo_hash = $${params.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(body, "rola")) {
      const rola = normalizujTekst(body.rola);

      if (!czyAdmin) {
        return res.status(403).json({
          error: "Brak uprawnien do zmiany roli."
        });
      }

      if (uzytkownik.id === id) {
        return res.status(403).json({
          error: "Admin nie moze zmienic swojej roli."
        });
      }

      if (!dozwoloneRole.includes(rola)) {
        return res.status(400).json({
          error: "Nieprawidlowa rola."
        });
      }

      params.push(rola);
      pola.push(`rola = $${params.length}`);
    }

    if (pola.length === 0) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    params.push(id);

    const result = await pool.query(
      `
      UPDATE uzytkownicy
      SET ${pola.join(", ")}
      WHERE id = $${params.length}
      RETURNING id, imie, nazwisko, email, rola, data_utworzenia;
      `,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Podany email jest juz w bazie."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
}

router.patch("/edit/:id", edytujKonto);
router.put("/edit/:id", edytujKonto);

router.delete("/delete/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const czyAdmin = uzytkownik.rola === "admin";

    if (!czyAdmin && uzytkownik.id !== id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    if (czyAdmin && uzytkownik.id === id) {
      return res.status(403).json({
        error: "Admin nie moze usunac swojego konta."
      });
    }

    const result = await pool.query(
      `
      DELETE FROM uzytkownicy
      WHERE id = $1
      RETURNING id, imie, nazwisko, email, rola, data_utworzenia;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nie znaleziono konta."
      });
    }

    return res.status(200).json(mapujKonto(result.rows[0]));
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        error: "Nie mozna usunac konta, do ktorego przypisane sa wypozyczenia."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
