import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { LIMIT_WYNIKOW_WYSZUKIWANIA } from "../../../helpers/constants.js";
import { normalizujTekst } from "../../../helpers/common.js";
import { pobierzPierwszeZdjecieUrl } from "../../../helpers/images.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const wyszukiwanaNazwa = normalizujTekst(
      req.query.q ?? req.query.search ?? req.query.nazwa
    );

    if (!wyszukiwanaNazwa) {
      return res.status(200).json([]);
    }

    const result = await pool.query(
      `
      SELECT id, nazwa, zdjecia_url, cena, cena_po_promocji
      FROM sprzety
      WHERE nazwa ILIKE $1
      ORDER BY
        CASE WHEN nazwa ILIKE $2 THEN 0 ELSE 1 END,
        nazwa,
        id
      LIMIT $3;
      `,
      [
        `%${wyszukiwanaNazwa}%`,
        `${wyszukiwanaNazwa}%`,
        LIMIT_WYNIKOW_WYSZUKIWANIA
      ]
    );

    const dane = result.rows.map((sprzet) => ({
<<<<<<< HEAD
      id: sprzet.id,
=======
      id : sprzet.id,
>>>>>>> feature/frontend-items
      nazwa_przedmiotu: sprzet.nazwa,
      zdjecie_url: pobierzPierwszeZdjecieUrl(sprzet.zdjecia_url),
      cena: Number(sprzet.cena),
      cena_po_promocji:
        sprzet.cena_po_promocji === null
          ? null
          : Number(sprzet.cena_po_promocji),
      czy_promocja:
        sprzet.cena_po_promocji !== null &&
        Number(sprzet.cena_po_promocji) < Number(sprzet.cena)
    }));

    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
