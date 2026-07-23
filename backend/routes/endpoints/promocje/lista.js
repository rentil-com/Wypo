import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import {
  BladPromocji,
  mapujPromocje,
  polaPelnejPromocjiSql,
  STANY_PROMOCJI,
  stanPromocjiSql,
  TYPY_PROMOCJI
} from "../../../services/promocje.js";
import { odpowiedzBleduPromocji } from "./common.js";

const router = Router();
const LIMIT_PROMOCJI_NA_STRONE = 20;

router.get("/", async (req, res) => {
  try {
    const stronaPrzekazana = czyPolePrzekazane(req.query, "strona");
    const strona = stronaPrzekazana ? parsujId(req.query.strona) : 1;

    if (!strona) {
      throw new BladPromocji("Nieprawidlowy numer strony.");
    }

    const nazwa = normalizujTekst(req.query.nazwa);
    const typ = normalizujTekst(req.query.typ).toLowerCase();
    const stan = normalizujTekst(req.query.stan).toLowerCase();
    const params = [];
    const where = [];
    const filtry = {
      nazwa: nazwa || null,
      typ: typ || null,
      stan: stan || null,
      sprzet_id: null,
      kategoria_id: null,
      uzytkownik_id: null
    };

    if (typ && !TYPY_PROMOCJI.includes(typ)) {
      throw new BladPromocji("Nieprawidlowy typ promocji.");
    }

    if (stan && !STANY_PROMOCJI.includes(stan)) {
      throw new BladPromocji("Nieprawidlowy stan promocji.");
    }

    if (nazwa) {
      params.push(`%${nazwa}%`);
      where.push(`p.nazwa ILIKE $${params.length}`);
    }

    if (typ) {
      params.push(typ);
      where.push(`p.typ = $${params.length}::typ_promocji`);
    }

    if (stan) {
      params.push(stan);
      where.push(`${stanPromocjiSql("p")} = $${params.length}`);
    }

    if (czyPolePrzekazane(req.query, "sprzet_id")) {
      const sprzetId = parsujId(req.query.sprzet_id);

      if (!sprzetId) {
        throw new BladPromocji("Nieprawidlowe ID sprzetu.");
      }

      params.push(sprzetId);
      filtry.sprzet_id = sprzetId;
      where.push(`(
        p.obejmuje_wszystkie_sprzety = TRUE
        OR EXISTS (
          SELECT 1
          FROM promocje_sprzety ps
          WHERE ps.promocja_id = p.id
            AND ps.sprzet_id = $${params.length}
        )
        OR EXISTS (
          SELECT 1
          FROM promocje_kategorie pk
          JOIN sprzety filtrowany_sprzet
            ON filtrowany_sprzet.kategoria_id = pk.kategoria_id
          WHERE pk.promocja_id = p.id
            AND filtrowany_sprzet.id = $${params.length}
        )
      )`);
    }

    if (czyPolePrzekazane(req.query, "kategoria_id")) {
      const kategoriaId = parsujId(req.query.kategoria_id);

      if (!kategoriaId) {
        throw new BladPromocji("Nieprawidlowe ID kategorii.");
      }

      params.push(kategoriaId);
      filtry.kategoria_id = kategoriaId;
      where.push(`(
        p.obejmuje_wszystkie_sprzety = TRUE
        OR EXISTS (
          SELECT 1
          FROM promocje_kategorie pk
          WHERE pk.promocja_id = p.id
            AND pk.kategoria_id = $${params.length}
        )
      )`);
    }

    if (czyPolePrzekazane(req.query, "uzytkownik_id")) {
      const uzytkownikId = parsujId(req.query.uzytkownik_id);

      if (!uzytkownikId) {
        throw new BladPromocji("Nieprawidlowe ID uzytkownika.");
      }

      params.push(uzytkownikId);
      filtry.uzytkownik_id = uzytkownikId;
      where.push(`(
        p.obejmuje_wszystkich_uzytkownikow = TRUE
        OR EXISTS (
          SELECT 1
          FROM promocje_uzytkownicy pu
          WHERE pu.promocja_id = p.id
            AND pu.uzytkownik_id = $${params.length}
        )
      )`);
    }

    const whereSql = where.length > 0
      ? `WHERE ${where.join(" AND ")}`
      : "";
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const offset = (strona - 1) * LIMIT_PROMOCJI_NA_STRONE;

    const result = await pool.query(
      `
      SELECT ${polaPelnejPromocjiSql("p")}
      FROM promocje p
      ${whereSql}
      ORDER BY p.data_utworzenia DESC, p.id DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex};
      `,
      [...params, LIMIT_PROMOCJI_NA_STRONE, offset]
    );
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM promocje p
      ${whereSql};
      `,
      params
    );
    const total = Number(countResult.rows[0].total);

    return res.status(200).json({
      strona,
      limitPromocjiNaStrone: LIMIT_PROMOCJI_NA_STRONE,
      filtry,
      total,
      liczbaStron: Math.ceil(total / LIMIT_PROMOCJI_NA_STRONE),
      dane: result.rows.map(mapujPromocje)
    });
  } catch (err) {
    return odpowiedzBleduPromocji(err, res);
  }
});

export default router;

