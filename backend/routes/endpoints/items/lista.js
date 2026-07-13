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

const router = Router();

router.get("/", async (req, res) => {
  try {
    const czyAdmin = req.uzytkownik?.rola === "admin";
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
    const whereParams = [];

    if (kategoria) {
      whereParams.push(kategoria);
      where.push(`kategoria_id = $${whereParams.length}`);
    }

    if (status && DOZWOLONE_STATUSY.includes(status)) {
      if (czyAdmin) {
        whereParams.push(status);
        where.push(`status = $${whereParams.length}`);
        zastosowanyStatus = status;
      } else if (status === "dostepny") {
        whereParams.push("dostepny");
        where.push(`status = $${whereParams.length}`);
        zastosowanyStatus = "dostepny";
      }
    }

    if (nazwa) {
      whereParams.push(`%${nazwa}%`);
      where.push(`nazwa ILIKE $${whereParams.length}`);
    }

    if (cenaOd !== null) {
      whereParams.push(cenaOd);
      where.push(
        `COALESCE(cena_po_promocji, cena) >= $${whereParams.length}`
      );
    }

    if (cenaDo !== null) {
      whereParams.push(cenaDo);
      where.push(
        `COALESCE(cena_po_promocji, cena) <= $${whereParams.length}`
      );
    }

    if (tylkoPromocje) {
      where.push("cena_po_promocji IS NOT NULL AND cena > cena_po_promocji");
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const resultParams = [
      ...whereParams,
      LIMIT_PRZEDMIOTOW_NA_STRONE,
      offset
    ];
    const limitIndex = whereParams.length + 1;
    const offsetIndex = whereParams.length + 2;

    const result = await pool.query(
      `
      SELECT ${podstawowePolaSprzetuSql("s")}
      FROM sprzety s
      ${whereSql}
      ORDER BY s.id
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      resultParams
    );

    const countQuery = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM sprzety
      ${whereSql};
      `,
      whereParams
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
      error: "Błąd serwera"
    });
  }
});

export default router;
