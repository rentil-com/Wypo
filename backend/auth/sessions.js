import { pool } from '../db/pool.js';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import 'dotenv/config';
import crypto from 'crypto';

const SESSION_MAX_AGE = 1000 * 60 * 60 * 24;

function stworzTokenSesji() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashujTokenSesji(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function pobierzUzytkownikaZSesji(req) {
  const tokenSesji = req.cookies?.session_id;

  if (!tokenSesji) {
    return null;
  }

  const hashSesji = hashujTokenSesji(tokenSesji);

  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.imie,
      u.nazwisko,
      u.email,
      u.rola
    FROM sesje s
    JOIN uzytkownicy u
      ON u.id = s.uzytkownik_id
    WHERE s.session_hash = $1
      AND s.data_wygasniecia > NOW()
    LIMIT 1
    `,
    [hashSesji]
  );

  if (result.rowCount < 1) {
    return null;
  }

  await pool.query(
    `
    UPDATE sesje
    SET ostatnia_aktywnosc = NOW()
    WHERE session_hash = $1
    `,
    [hashSesji]
  );

  return result.rows[0];
}

export async function pobierzRoleZSesji(req) {
  const uzytkownik = await pobierzUzytkownikaZSesji(req);
  return uzytkownik?.rola || null;
}

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Nieprawidłowe zapytanie.'
      });
    }

    const result = await pool.query(
      `
      SELECT haslo_hash, email, id, rola
      FROM uzytkownicy
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount < 1) {
      return res.status(401).json({
        error: 'Nieprawidłowe hasło lub użytkownik'
      });
    }

    const user = result.rows[0];

    const czyPoprawne = await bcrypt.compare(password, user.haslo_hash);

    if (!czyPoprawne) {
      return res.status(401).json({
        error: 'Nieprawidłowe hasło lub użytkownik'
      });
    }

    const tokenSesji = stworzTokenSesji();
    const hashSesji = hashujTokenSesji(tokenSesji);

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

    await pool.query(
      `
      INSERT INTO sesje (
        session_hash,
        uzytkownik_id,
        data_wygasniecia
      )
      VALUES ($1, $2, $3)
      `,
      [hashSesji, user.id, expiresAt]
    );

    res.cookie('session_id', tokenSesji, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE
    });

    return res.status(200).json({
      message: 'Zalogowano',
      user: {
        id: user.id,
        email: user.email,
        rola: user.rola
      }
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Błąd serwera'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const tokenSesji = req.cookies?.session_id;

    if (tokenSesji) {
      const hashSesji = hashujTokenSesji(tokenSesji);

      await pool.query(
        `
        DELETE FROM sesje
        WHERE session_hash = $1
        `,
        [hashSesji]
      );
    }

    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'prod',
      sameSite: 'lax'
    });

    return res.status(200).json({
      message: 'Wylogowano'
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Błąd serwera'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { imie, nazwisko, email, password } = req.body || {};

    if (!email || !password || !imie || !nazwisko) {
      return res.status(400).json({
        error: 'Nieprawidłowe zapytanie.'
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
        error: "Podany email jest już w bazie."
      });
    }

    const hasloHash = await bcrypt.hash(password, 12);

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
      error: 'Błąd serwera'
    });
  }
});

export default router;