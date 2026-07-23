import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  mapujPromocje,
  parsujDanePromocji,
  pobierzPromocjePoId,
  walidujIstnienieZakresow,
  walidujSpojnoscPromocji,
  zapiszZakresyPromocji
} from "../../../services/promocje.js";
import { odpowiedzBleduPromocji } from "./common.js";

const router = Router();

router.post("/", async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;

  try {
    const dane = parsujDanePromocji(req.body);
    walidujSpojnoscPromocji(dane);

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    await walidujIstnienieZakresow(
      client,
      dane.zakres_sprzetow,
      dane.zakres_uzytkownikow
    );

    const result = await client.query(
      `
      INSERT INTO promocje (
        nazwa,
        opis,
        typ,
        wartosc,
        obejmuje_wszystkie_sprzety,
        obejmuje_wszystkich_uzytkownikow,
        aktywna,
        data_od,
        data_do,
        utworzona_przez
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
      `,
      [
        dane.nazwa,
        dane.opis,
        dane.typ,
        dane.wartosc,
        dane.zakres_sprzetow.wszystkie,
        dane.zakres_uzytkownikow.wszyscy,
        dane.aktywna,
        dane.data_od,
        dane.data_do,
        req.uzytkownik.id
      ]
    );
    const promocjaId = result.rows[0].id;

    await zapiszZakresyPromocji(
      client,
      promocjaId,
      dane.zakres_sprzetow,
      dane.zakres_uzytkownikow
    );

    const promocja = await pobierzPromocjePoId(client, promocjaId);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(201).json(mapujPromocje(promocja));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    return odpowiedzBleduPromocji(err, res);
  } finally {
    if (client) {
      client.release();
    }
  }
});

export default router;

