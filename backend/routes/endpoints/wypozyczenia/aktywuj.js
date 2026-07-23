import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  mailAktywacjaWypozyczenia,
  mailDecyzjaWnioskuWypozyczenia
} from "../../../mail/formatyMaili.js";
import { parsujId } from "../../../helpers/common.js";
import { mapujWypozyczenie } from "../../../helpers/wypozyczenia.js";
import {
  czySprzetMaAktywneWypozyczenia,
  odrzucKonfliktujaceWnioski,
  pobierzAktywneKonfliktujaceWypozyczenie,
  pobierzSprzetDoAktualizacji,
  pobierzWypozyczenieDoAktualizacji
} from "../../../services/wypozyczenia.js";
import { wyslijMailWypozyczeniaWTle } from "../../../services/maile-wypozyczen.js";

const router = Router();

async function aktywujWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wypozyczenia."
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

    if (wypozyczenie.status !== "zaakceptowany") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Mozna aktywowac tylko zaakceptowane wypozyczenie."
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

    const sprzetZajetyPrzezInne = await czySprzetMaAktywneWypozyczenia(
      client,
      wypozyczenie.sprzet_id,
      wypozyczenie.id
    );

    const konfliktAktywnego = await pobierzAktywneKonfliktujaceWypozyczenie(
      client,
      wypozyczenie
    );

    if (konfliktAktywnego) {
      const odrzuconyResult = await client.query(
        `
        UPDATE wypozyczenia
        SET status = 'odrzucony'
        WHERE id = $1
        RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista, promocja_id, cena_bazowa, cena_koncowa, promocja_nazwa, promocja_typ, promocja_wartosc;
        `,
        [wypozyczenie.id]
      );

      await client.query("COMMIT");

      wyslijMailWypozyczeniaWTle(
        odrzuconyResult.rows[0].id,
        (dane) =>
          mailDecyzjaWnioskuWypozyczenia({
            ...dane,
            status: "odrzucony",
            powod: "Daty koliduja z aktywnym wypozyczeniem."
          }),
        "automatyczne odrzucenie wniosku o wypozyczenie"
      );

      return res.status(409).json({
        error: "Wniosek zostal automatycznie odrzucony, bo daty koliduja z aktywnym wypozyczeniem.",
        konflikt_wypozyczenie_id: konfliktAktywnego.id,
        wypozyczenie: mapujWypozyczenie(odrzuconyResult.rows[0])
      });
    }

    if (sprzet.status === "wypozyczony" || sprzetZajetyPrzezInne) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Sprzet jest juz wypozyczony."
      });
    }

    if (sprzet.status !== "dostepny") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Sprzet nie jest dostepny."
      });
    }

    const result = await client.query(
      `
      UPDATE wypozyczenia
      SET status = 'aktywny'
      WHERE id = $1
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista, promocja_id, cena_bazowa, cena_koncowa, promocja_nazwa, promocja_typ, promocja_wartosc;
      `,
      [id]
    );

    const odrzuconeKonflikty = await odrzucKonfliktujaceWnioski(
      client,
      result.rows[0]
    );

    await client.query(
      `
      UPDATE sprzety
      SET status = 'wypozyczony'
      WHERE id = $1;
      `,
      [wypozyczenie.sprzet_id]
    );

    await client.query("COMMIT");

    wyslijMailWypozyczeniaWTle(
      result.rows[0].id,
      mailAktywacjaWypozyczenia,
      "aktywacja wypozyczenia"
    );

    for (const odrzuconeId of odrzuconeKonflikty) {
      wyslijMailWypozyczeniaWTle(
        odrzuconeId,
        (dane) =>
          mailDecyzjaWnioskuWypozyczenia({
            ...dane,
            status: "odrzucony",
            powod: "Daty koliduja z aktywowanym wypozyczeniem."
          }),
        "automatyczne odrzucenie konfliktujacego wniosku"
      );
    }

    return res.status(200).json({
      ...mapujWypozyczenie(result.rows[0]),
      odrzucone_konflikty: odrzuconeKonflikty
    });
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

router.patch("/:id", aktywujWypozyczenie);
router.post("/:id", aktywujWypozyczenie);

export default router;
