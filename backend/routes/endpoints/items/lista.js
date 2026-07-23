import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  DOZWOLONE_STATUSY,
  LIMIT_PRZEDMIOTOW_NA_STRONE
} from "../../../helpers/constants.js";
import { normalizujTekst, parsujId } from "../../../helpers/common.js";
import { mapujSprzet, podstawowePolaSprzetuSql } from "../../../helpers/items.js";
import {
  parsujBoolean,
  parsujFiltrCeny
} from "../../../helpers/validation.js";
import {
  polaPromocjiSprzetuSql,
  promocjaLateralSql
} from "../../../services/promocje.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const czyAdmin = req.uzytkownik?.rola === "admin";
    const uzytkownikId = req.uzytkownik?.id || null;
    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * LIMIT_PRZEDMIOTOW_NA_STRONE;
    const kategoria = req.query.kategoria
      ? parsujId(req.query.kategoria)
      : null;
    const status = DOZWOLONE_STATUSY.includes(req.query.status)
      ? req.query.status
      : null;
    let zastosowanyStatus = null;
    const nazwa = normalizujTekst(req.query.nazwa);
    const cenaOd = parsujFiltrCeny(req.query.cena_od ?? req.query.cena_min);
    const cenaDo = parsujFiltrCeny(req.query.cena_do ?? req.query.cena_max);
    const tylkoPromocje = parsujBoolean(
      req.query.promocja ?? req.query.tylko_promocje
    );

    const where = [];
    const params = [uzytkownikId];

    if (kategoria) {
      params.push(kategoria);
      where.push(`kategoria_id = $${params.length}`);
    }

    if (status) {
      if (czyAdmin) {
        params.push(status);
        where.push(`status = $${params.length}`);
        zastosowanyStatus = status;
      } else if (status === "dostepny") {
        params.push("dostepny");
        where.push(`status = $${params.length}`);
        zastosowanyStatus = "dostepny";
      }
    }

    if (nazwa) {
      params.push(`%${nazwa}%`);
      where.push(`nazwa ILIKE $${params.length}`);
    }

    if (cenaOd !== null) {
      params.push(cenaOd);
      where.push(`cena_aktualna >= $${params.length}`);
    }

    if (cenaDo !== null) {
      params.push(cenaDo);
      where.push(`cena_aktualna <= $${params.length}`);
    }

    if (tylkoPromocje) {
      where.push("promocja_id IS NOT NULL");
    }

    const katalogSql = `
      SELECT
        ${podstawowePolaSprzetuSql("s")},
        ${polaPromocjiSprzetuSql("s", "najlepsza_promocja")}
      FROM sprzety s
      ${promocjaLateralSql({
        sprzetAlias: "s",
        promocjaAlias: "najlepsza_promocja",
        uzytkownikParam: "$1"
      })}
    `;
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const result = await pool.query(
      `
      WITH katalog AS (${katalogSql})
      SELECT *
      FROM katalog
      ${whereSql}
      ORDER BY id
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      [...params, LIMIT_PRZEDMIOTOW_NA_STRONE, offset]
    );

    const countQuery = await pool.query(
      `
      WITH katalog AS (${katalogSql})
      SELECT COUNT(*) AS total
      FROM katalog
      ${whereSql};
      `,
      params
    );

    const total = Number(countQuery.rows[0].total);
    const liczbaStron = Math.ceil(total / LIMIT_PRZEDMIOTOW_NA_STRONE);
    const dane = result.rows.map((sprzet) => mapujSprzet(sprzet, czyAdmin));

    return res.status(200).json({
      strona,
      limitPrzedmiotowNaStrone: LIMIT_PRZEDMIOTOW_NA_STRONE,
      kategoria,
      status: zastosowanyStatus,
      nazwa: nazwa || null,
      cena_od: cenaOd,
      cena_do: cenaDo,
      promocja: tylkoPromocje,
      czyAdmin,
      total,
      liczbaStron,
      dane
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
