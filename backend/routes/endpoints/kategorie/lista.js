import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { normalizujTekst } from "../../../helpers/common.js";
import { mapujKategorie } from "../../../helpers/kategorie.js";

const router = Router();

router.get("/", async (req, res) => {
  const nazwa = normalizujTekst(req.query.nazwa);
  const params = [];
  const where = [];

  if (nazwa) {
    params.push(`%${nazwa}%`);
    where.push(`k.nazwa ILIKE $${params.length}`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      k.id,
      k.nazwa,
      k.zdjecie_url,
      COUNT(s.id) AS liczba_sprzetow,
      COUNT(s.id) FILTER (WHERE s.status = 'dostepny') AS liczba_dostepnych_sprzetow
    FROM kategorie k
    LEFT JOIN sprzety s
      ON s.kategoria_id = k.id
    ${whereSql}
    GROUP BY k.id, k.nazwa, k.zdjecie_url
    ORDER BY k.id;
    `,
    params
  );

  const dane = result.rows.map(mapujKategorie);

  return res.status(200).json(dane);
});

export default router;
