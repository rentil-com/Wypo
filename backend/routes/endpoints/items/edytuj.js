import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { DOZWOLONE_STATUSY } from "../../../helpers/constants.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  normalizujTekstOpcjonalny,
  parsujId
} from "../../../helpers/common.js";
import { mapujSprzet } from "../../../helpers/items.js";
import {
  parsujCene,
  parsujSpecyfikacje,
  pobierzSpecyfikacjeZBody
} from "../../../helpers/validation.js";
import { parsujEdycjeBezZdjec } from "../../../middleware/upload.js";
import { pobierzSprzetPoId } from "../../../services/items.js";
import { zapiszSpecyfikacjeSprzetu } from "../../../services/specifications.js";

const router = Router();

async function edytujSprzet(req, res) {
  let client = null;
  let transakcjaAktywna = false;

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const body = req.body || {};

    if (
      czyPolePrzekazane(body, "zdjecie_url") ||
      czyPolePrzekazane(body, "zdjecia_url")
    ) {
      return res.status(400).json({
        error:
          "Zdjecia sprzetu mozna zmieniac tylko przez add_photos albo delete_photos."
      });
    }

    const pola = [];
    const params = [];
    let cena = null;
    let cenaPoPromocji = null;
    const specyfikacjeZBody = pobierzSpecyfikacjeZBody(body);
    let specyfikacjeDoZapisu = null;

    if (specyfikacjeZBody.przekazane) {
      const specyfikacje = parsujSpecyfikacje(specyfikacjeZBody.wartosc);

      if (!specyfikacje.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowe specyfikacje sprzetu."
        });
      }

      specyfikacjeDoZapisu = specyfikacje.wartosc;
    }

    if (czyPolePrzekazane(body, "nazwa")) {
      const nazwa = normalizujTekst(body.nazwa);

      if (!nazwa || nazwa.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowa nazwa sprzetu."
        });
      }

      params.push(nazwa);
      pola.push(`nazwa = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "opis")) {
      const opis = normalizujTekstOpcjonalny(body.opis);
      params.push(opis);
      pola.push(`opis = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "kategoria_id")) {
      const kategoriaId = parsujId(body.kategoria_id);

      if (!kategoriaId) {
        return res.status(400).json({
          error: "Nieprawidlowa kategoria sprzetu."
        });
      }

      params.push(kategoriaId);
      pola.push(`kategoria_id = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "status")) {
      const status = normalizujTekst(body.status);

      if (!DOZWOLONE_STATUSY.includes(status)) {
        return res.status(400).json({
          error: "Nieprawidlowy status sprzetu."
        });
      }

      params.push(status);
      pola.push(`status = $${params.length}`);
    }

    const czyZmianaCeny =
      czyPolePrzekazane(body, "cena") ||
      czyPolePrzekazane(body, "cena_po_promocji");

    if (czyPolePrzekazane(body, "cena")) {
      cena = parsujCene(body.cena, true);

      if (!cena.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowa cena sprzetu."
        });
      }
    }

    if (czyPolePrzekazane(body, "cena_po_promocji")) {
      cenaPoPromocji = parsujCene(body.cena_po_promocji);

      if (!cenaPoPromocji.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowa cena promocyjna sprzetu."
        });
      }
    }

    if (
      pola.length === 0 &&
      !czyZmianaCeny &&
      specyfikacjeDoZapisu === null
    ) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT cena, cena_po_promocji
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const obecnySprzet = obecnyResult.rows[0];

    if (czyZmianaCeny) {
      const aktualnaCena = cena ? cena.wartosc : Number(obecnySprzet.cena);
      const aktualnaCenaPoPromocji = cenaPoPromocji
        ? cenaPoPromocji.wartosc
        : obecnySprzet.cena_po_promocji === null
          ? null
          : Number(obecnySprzet.cena_po_promocji);

      if (
        aktualnaCenaPoPromocji !== null &&
        aktualnaCenaPoPromocji > aktualnaCena
      ) {
        await client.query("ROLLBACK");
        transakcjaAktywna = false;

        return res.status(400).json({
          error: "Cena promocyjna nie moze byc wieksza od ceny."
        });
      }

      if (cena) {
        params.push(cena.wartosc);
        pola.push(`cena = $${params.length}`);
      }

      if (cenaPoPromocji) {
        params.push(cenaPoPromocji.wartosc);
        pola.push(`cena_po_promocji = $${params.length}`);
      }
    }

    if (pola.length > 0) {
      params.push(id);

      await client.query(
        `
        UPDATE sprzety
        SET ${pola.join(", ")}
        WHERE id = $${params.length}
        RETURNING id;
        `,
        params
      );
    }

    if (specyfikacjeDoZapisu !== null) {
      await zapiszSpecyfikacjeSprzetu(client, id, specyfikacjeDoZapisu);
    }

    const sprzet = await pobierzSprzetPoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono kategorii."
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe dane sprzetu."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

router.patch("/:id", parsujEdycjeBezZdjec, edytujSprzet);
router.put("/:id", parsujEdycjeBezZdjec, edytujSprzet);

export default router;
