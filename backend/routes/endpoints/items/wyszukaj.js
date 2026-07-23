import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { LIMIT_WYNIKOW_WYSZUKIWANIA } from "../../../helpers/constants.js";
import { normalizujTekst } from "../../../helpers/common.js";
import { pobierzPierwszeZdjecieUrl } from "../../../helpers/images.js";
import {
  mapujSkrotPromocji,
  polaPromocjiSprzetuSql,
  promocjaLateralSql
} from "../../../services/promocje.js";

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
      SELECT
        s.id,
        s.nazwa,
        s.zdjecia_url,
        s.cena,
        ${polaPromocjiSprzetuSql("s", "najlepsza_promocja")}
      FROM sprzety s
      ${promocjaLateralSql({
        sprzetAlias: "s",
        promocjaAlias: "najlepsza_promocja",
        uzytkownikParam: "$1"
      })}
      WHERE s.nazwa ILIKE $2
      ORDER BY
        CASE WHEN s.nazwa ILIKE $3 THEN 0 ELSE 1 END,
        s.nazwa,
        s.id
      LIMIT $4;
      `,
      [
        req.uzytkownik?.id || null,
        `%${wyszukiwanaNazwa}%`,
        `${wyszukiwanaNazwa}%`,
        LIMIT_WYNIKOW_WYSZUKIWANIA
      ]
    );

    const dane = result.rows.map((sprzet) => {
      const promocja = mapujSkrotPromocji(sprzet);

      return {
        id: Number(sprzet.id),
        nazwa_przedmiotu: sprzet.nazwa,
        zdjecie_url: pobierzPierwszeZdjecieUrl(sprzet.zdjecia_url),
        cena: Number(sprzet.cena),
        cena_aktualna: Number(sprzet.cena_aktualna),
        czy_promocja: promocja !== null,
        promocja
      };
    });

    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
