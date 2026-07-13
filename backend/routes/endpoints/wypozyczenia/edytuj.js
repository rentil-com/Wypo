import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  mailAktywacjaWypozyczenia,
  mailDecyzjaWnioskuWypozyczenia,
  mailPotwierdzenieZwrotu
} from "../../../mail/formatyMaili.js";
import {
  czyPolePrzekazane,
  normalizujTekst,
  parsujId
} from "../../../helpers/common.js";
import {
  czyStatusBlokujeSprzet,
  DOZWOLONE_STATUSY_WYPOZYCZEN,
  mapujWypozyczenie,
  parsujDate
} from "../../../helpers/wypozyczenia.js";
import {
  czySprzetMaAktywneWypozyczenia,
  odrzucKonfliktujaceWnioski,
  odswiezStatusSprzetu,
  pobierzSprzetDoAktualizacji,
  pobierzWypozyczenieDoAktualizacji
} from "../../../services/wypozyczenia.js";
import { wyslijMailWypozyczeniaWTle } from "../../../services/maile-wypozyczen.js";

const router = Router();

async function edytujWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID wypozyczenia."
      });
    }

    const body = req.body || {};
    const pola = [];
    const params = [];
    let nowySprzetId = null;
    let nowyUzytkownikId = null;
    let nowaDataOd = null;
    let nowaDataDo = null;
    let nowyStatus = null;
    let dataZwrotuRzeczywista = null;
    let czyscDateZwrotu = false;

    if (czyPolePrzekazane(body, "sprzet_id")) {
      nowySprzetId = parsujId(body.sprzet_id);

      if (!nowySprzetId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID sprzetu."
        });
      }
    }

    if (czyPolePrzekazane(body, "uzytkownik_id")) {
      nowyUzytkownikId = parsujId(body.uzytkownik_id);

      if (!nowyUzytkownikId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID uzytkownika."
        });
      }
    }

    if (czyPolePrzekazane(body, "data_od")) {
      nowaDataOd = parsujDate(body.data_od);

      if (!nowaDataOd) {
        return res.status(400).json({
          error: "Nieprawidlowa data od."
        });
      }
    }

    if (czyPolePrzekazane(body, "data_do")) {
      nowaDataDo = parsujDate(body.data_do);

      if (!nowaDataDo) {
        return res.status(400).json({
          error: "Nieprawidlowa data do."
        });
      }
    }

    if (czyPolePrzekazane(body, "status")) {
      nowyStatus = normalizujTekst(body.status);

      if (!DOZWOLONE_STATUSY_WYPOZYCZEN.includes(nowyStatus)) {
        return res.status(400).json({
          error: "Nieprawidlowy status wypozyczenia."
        });
      }
    }

    if (czyPolePrzekazane(body, "data_zwrotu_rzeczywista")) {
      if (
        body.data_zwrotu_rzeczywista === null ||
        body.data_zwrotu_rzeczywista === ""
      ) {
        czyscDateZwrotu = true;
      } else {
        dataZwrotuRzeczywista = parsujDate(body.data_zwrotu_rzeczywista);

        if (!dataZwrotuRzeczywista) {
          return res.status(400).json({
            error: "Nieprawidlowa data rzeczywistego zwrotu."
          });
        }
      }
    }

    if (
      !nowySprzetId &&
      !nowyUzytkownikId &&
      !nowaDataOd &&
      !nowaDataDo &&
      !nowyStatus &&
      !czyPolePrzekazane(body, "data_zwrotu_rzeczywista")
    ) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    await client.query("BEGIN");

    const obecneWypozyczenie = await pobierzWypozyczenieDoAktualizacji(
      client,
      id
    );

    if (!obecneWypozyczenie) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono wypozyczenia."
      });
    }

    const finalnySprzetId = nowySprzetId || obecneWypozyczenie.sprzet_id;
    const finalnyStatus = nowyStatus || obecneWypozyczenie.status;
    const finalnaDataOd = nowaDataOd || obecneWypozyczenie.data_od;
    const finalnaDataDo = nowaDataDo || obecneWypozyczenie.data_do;

    if (new Date(finalnaDataDo) < new Date(finalnaDataOd)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Data do nie moze byc wczesniejsza niz data od."
      });
    }

    if (nowyUzytkownikId) {
      const kontoResult = await client.query(
        `
        SELECT id
        FROM uzytkownicy
        WHERE id = $1
        LIMIT 1;
        `,
        [nowyUzytkownikId]
      );

      if (kontoResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          error: "Nie znaleziono uzytkownika."
        });
      }
    }

    let odrzuconeKonfliktyPoEdycji = [];
    const blokujePrzedZmiana = czyStatusBlokujeSprzet(
      obecneWypozyczenie.status
    );
    const blokujePoZmianie = czyStatusBlokujeSprzet(finalnyStatus);
    const czyZmianaSprzetu =
      finalnySprzetId !== obecneWypozyczenie.sprzet_id;

    const obecnySprzet = await pobierzSprzetDoAktualizacji(
      client,
      obecneWypozyczenie.sprzet_id
    );

    if (!obecnySprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono obecnego sprzetu."
      });
    }

    let finalnySprzet = obecnySprzet;

    if (czyZmianaSprzetu) {
      finalnySprzet = await pobierzSprzetDoAktualizacji(
        client,
        finalnySprzetId
      );

      if (!finalnySprzet) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          error: "Nie znaleziono nowego sprzetu."
        });
      }
    }

    if (blokujePoZmianie) {
      const nowySprzetZajetyPrzezInne =
        await czySprzetMaAktywneWypozyczenia(client, finalnySprzetId, id);

      if (
        nowySprzetZajetyPrzezInne ||
        (czyZmianaSprzetu && finalnySprzet.status !== "dostepny")
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          error: "Sprzet nie jest dostepny."
        });
      }

      if (
        !czyZmianaSprzetu &&
        !blokujePrzedZmiana &&
        finalnySprzet.status !== "dostepny"
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          error: "Sprzet nie jest dostepny."
        });
      }
    }

    if (nowySprzetId) {
      params.push(nowySprzetId);
      pola.push(`sprzet_id = $${params.length}`);
    }

    if (nowyUzytkownikId) {
      params.push(nowyUzytkownikId);
      pola.push(`uzytkownik_id = $${params.length}`);
    }

    if (nowaDataOd) {
      params.push(nowaDataOd);
      pola.push(`data_od = $${params.length}`);
    }

    if (nowaDataDo) {
      params.push(nowaDataDo);
      pola.push(`data_do = $${params.length}`);
    }

    if (nowyStatus) {
      params.push(nowyStatus);
      pola.push(`status = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "data_zwrotu_rzeczywista")) {
      params.push(czyscDateZwrotu ? null : dataZwrotuRzeczywista);
      pola.push(`data_zwrotu_rzeczywista = $${params.length}`);
    }

    params.push(id);

    const result = await client.query(
      `
      UPDATE wypozyczenia
      SET ${pola.join(", ")}
      WHERE id = $${params.length}
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      params
    );

    if (blokujePoZmianie) {
      await client.query(
        `
        UPDATE sprzety
        SET status = 'wypozyczony'
        WHERE id = $1;
        `,
        [finalnySprzetId]
      );
      odrzuconeKonfliktyPoEdycji = await odrzucKonfliktujaceWnioski(
        client,
        result.rows[0]
      );
    } else {
      await odswiezStatusSprzetu(
        client,
        finalnySprzetId,
        finalnyStatus !== "zwrocony"
      );
    }

    if (czyZmianaSprzetu || (blokujePrzedZmiana && !blokujePoZmianie)) {
      await odswiezStatusSprzetu(client, obecneWypozyczenie.sprzet_id);
    }

    await client.query("COMMIT");

    if (nowyStatus && result.rows[0].status !== obecneWypozyczenie.status) {
      if (["zaakceptowany", "odrzucony"].includes(result.rows[0].status)) {
        wyslijMailWypozyczeniaWTle(
          result.rows[0].id,
          (dane) =>
            mailDecyzjaWnioskuWypozyczenia({
              ...dane,
              status: result.rows[0].status
            }),
          "reczna zmiana decyzji wniosku"
        );
      }

      if (result.rows[0].status === "aktywny") {
        wyslijMailWypozyczeniaWTle(
          result.rows[0].id,
          mailAktywacjaWypozyczenia,
          "reczna aktywacja wypozyczenia"
        );
      }

      if (result.rows[0].status === "zwrocony") {
        wyslijMailWypozyczeniaWTle(
          result.rows[0].id,
          mailPotwierdzenieZwrotu,
          "reczne potwierdzenie zwrotu"
        );
      }
    }

    for (const odrzuconeId of odrzuconeKonfliktyPoEdycji) {
      wyslijMailWypozyczeniaWTle(
        odrzuconeId,
        (dane) =>
          mailDecyzjaWnioskuWypozyczenia({
            ...dane,
            status: "odrzucony",
            powod: "Daty koliduja z aktywnym wypozyczeniem."
          }),
        "automatyczne odrzucenie konfliktujacego wniosku po edycji"
      );
    }

    return res.status(200).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono powiazanych danych."
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe dane wypozyczenia."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    client.release();
  }
}

router.patch("/:id", edytujWypozyczenie);
router.put("/:id", edytujWypozyczenie);

export default router;
