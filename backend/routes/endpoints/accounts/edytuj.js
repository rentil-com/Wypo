import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../../db/pool.js";
import { normalizujEmail } from "../../../helpers/zabezpieczenia.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import {
  czyPoprawnyEmail,
  DOZWOLONE_ROLE,
  mapujKonto
} from "../../../helpers/accounts.js";

const router = Router();

async function edytujKonto(req, res) {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID konta."
      });
    }

    const czyAdmin = req.uzytkownik.rola === "admin";

    if (!czyAdmin && req.uzytkownik.id !== id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const pola = [];
    const params = [];
    const body = req.body || {};

    if (czyPolePrzekazane(body, "imie")) {
      const imie = normalizujTekst(body.imie);

      if (!imie || imie.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowe imie."
        });
      }

      params.push(imie);
      pola.push(`imie = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "nazwisko")) {
      const nazwisko = normalizujTekst(body.nazwisko);

      if (!nazwisko || nazwisko.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowe nazwisko."
        });
      }

      params.push(nazwisko);
      pola.push(`nazwisko = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "email")) {
      if (!czyAdmin) {
        return res.status(400).json({
          error: "Adres e-mail zmien przez endpoint /account/email-change."
        });
      }

      const email = normalizujEmail(body.email);

      if (!email || email.length > 255 || !czyPoprawnyEmail(email)) {
        return res.status(400).json({
          error: "Nieprawidlowy email."
        });
      }

      params.push(email);
      pola.push(`email = $${params.length}`);
    }

    const noweHaslo = czyPolePrzekazane(body, "haslo")
      ? body.haslo
      : body.password;

    if (
      czyPolePrzekazane(body, "haslo") ||
      czyPolePrzekazane(body, "password")
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

    if (czyPolePrzekazane(body, "rola")) {
      const rola = normalizujTekst(body.rola);

      if (!czyAdmin) {
        return res.status(403).json({
          error: "Brak uprawnien do zmiany roli."
        });
      }

      if (req.uzytkownik.id === id) {
        return res.status(403).json({
          error: "Admin nie moze zmienic swojej roli."
        });
      }

      if (!DOZWOLONE_ROLE.includes(rola)) {
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
      RETURNING id, imie, nazwisko, email, rola, dwuetapowe, data_utworzenia;
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

router.patch("/:id", edytujKonto);
router.put("/:id", edytujKonto);

export default router;
