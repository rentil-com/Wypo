import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { mailDecyzjaWnioskuWypozyczenia } from "../../../mail/formatyMaili.js";
import {
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import {
  mapujWypozyczenie,
  parsujDecyzje
} from "../../../helpers/wypozyczenia.js";
import {
  czySprzetMaAktywneWypozyczenia,
  odswiezStatusSprzetu,
  pobierzSprzetDoAktualizacji,
  pobierzWypozyczenieDoAktualizacji
} from "../../../services/wypozyczenia.js";
import { wyslijMailWypozyczeniaWTle } from "../../../services/maile-wypozyczen.js";

const router = Router();

async function zarzadzajWnioskiem(req, res) {
  const client = await pool.connect();

  try {
    const id = parsujId(req.params.id);
    const nowyStatus = parsujDecyzje(req.body?.decyzja ?? req.body?.status);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wypozyczenia."
      });
    }

    if (!nowyStatus) {
      return res.status(400).json({
        error: "Decyzja musi miec wartosc zaakceptowany albo odrzucony."
      });
    }

    await client.query("BEGIN");

    const wypozyczenie = await pobierzWypozyczenieDoAktualizacji(client, id);

    if (!wypozyczenie) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono wypozyczenia."
      });
    }

    if (wypozyczenie.status !== "oczekujacy") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Mozna zarzadzac tylko oczekujacym wnioskiem."
      });
    }

    const sprzet = await pobierzSprzetDoAktualizacji(
      client,
      wypozyczenie.sprzet_id
    );

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const sprzetZajetyPrzezInne = nowyStatus === "zaakceptowany"
      ? await czySprzetMaAktywneWypozyczenia(
          client,
          wypozyczenie.sprzet_id,
          wypozyczenie.id
        )
      : false;

    if (
      nowyStatus === "zaakceptowany" &&
      (sprzet.status !== "dostepny" || sprzetZajetyPrzezInne)
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Sprzet nie jest dostepny."
      });
    }

    const result = await client.query(
      `
      UPDATE wypozyczenia
      SET status = $1
      WHERE id = $2
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista, promocja_id, cena_bazowa, cena_koncowa, promocja_nazwa, promocja_typ, promocja_wartosc;
      `,
      [nowyStatus, id]
    );

    await odswiezStatusSprzetu(client, wypozyczenie.sprzet_id);
    await client.query("COMMIT");

    wyslijMailWypozyczeniaWTle(
      result.rows[0].id,
      (dane) =>
        mailDecyzjaWnioskuWypozyczenia({
          ...dane,
          status: nowyStatus,
          powod: normalizujTekst(req.body?.powod)
        }),
      "decyzja wniosku o wypozyczenie"
    );

    return res.status(200).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    client.release();
  }
}

router.patch("/:id", zarzadzajWnioskiem);
router.post("/:id", zarzadzajWnioskiem);

export default router;
