import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";

const router = Router();

const dozwoloneStatusyWypozyczen = [
  "oczekujacy",
  "zaakceptowany",
  "odrzucony",
  "aktywny",
  "zwrocony"
];
const statusyBlokujaceSprzet = ["aktywny"];

function normalizujTekst(wartosc) {
  return typeof wartosc === "string"
    ? wartosc.trim()
    : "";
}

function parsujId(wartosc) {
  const id = Number(wartosc);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function czyPolePrzekazane(body, pole) {
  return Object.prototype.hasOwnProperty.call(body, pole);
}

function parsujDate(wartosc) {
  if (wartosc === undefined || wartosc === null || String(wartosc).trim() === "") {
    return null;
  }

  const data = new Date(wartosc);

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

function czyStatusBlokujeSprzet(status) {
  return statusyBlokujaceSprzet.includes(status);
}

function mapujWypozyczenie(wypozyczenie) {
  return {
    id: wypozyczenie.id,
    sprzet_id: wypozyczenie.sprzet_id,
    uzytkownik_id: wypozyczenie.uzytkownik_id,
    data_zlozenia: wypozyczenie.data_zlozenia,
    data_od: wypozyczenie.data_od,
    data_do: wypozyczenie.data_do,
    status: wypozyczenie.status,
    data_zwrotu_rzeczywista: wypozyczenie.data_zwrotu_rzeczywista
  };
}

async function pobierzZalogowanego(req, res) {
  const uzytkownik = await pobierzUzytkownikaZSesji(req);

  if (!uzytkownik) {
    res.status(401).json({
      error: "Wymagane logowanie."
    });

    return null;
  }

  return uzytkownik;
}

function sprawdzAdmina(uzytkownik, res) {
  if (uzytkownik.rola !== "admin") {
    res.status(403).json({
      error: "Brak uprawnien."
    });

    return false;
  }

  return true;
}

async function pobierzWypozyczenieDoAktualizacji(client, id) {
  const result = await client.query(
    `
    SELECT id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista
    FROM wypozyczenia
    WHERE id = $1
    FOR UPDATE;
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function pobierzSprzetDoAktualizacji(client, id) {
  const result = await client.query(
    `
    SELECT id, status
    FROM sprzety
    WHERE id = $1
    FOR UPDATE;
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function czySprzetMaAktywneWypozyczenia(client, sprzetId, pominWypozyczenieId = null) {
  const params = [sprzetId, statusyBlokujaceSprzet];
  let dodatkowyWarunek = "";

  if (pominWypozyczenieId) {
    params.push(pominWypozyczenieId);
    dodatkowyWarunek = `AND id <> $${params.length}`;
  }

  const result = await client.query(
    `
    SELECT 1
    FROM wypozyczenia
    WHERE sprzet_id = $1
      AND status = ANY($2::status_wypozyczenia[])
      ${dodatkowyWarunek}
    LIMIT 1;
    `,
    params
  );

  return result.rows.length > 0;
}

async function pobierzAktywneKonfliktujaceWypozyczenie(client, wypozyczenie) {
  const result = await client.query(
    `
    SELECT id
    FROM wypozyczenia
    WHERE sprzet_id = $1
      AND id <> $2
      AND status = 'aktywny'
      AND data_od <= $4
      AND data_do >= $3
    LIMIT 1
    FOR UPDATE;
    `,
    [
      wypozyczenie.sprzet_id,
      wypozyczenie.id,
      wypozyczenie.data_od,
      wypozyczenie.data_do
    ]
  );

  return result.rows[0] || null;
}

async function odrzucKonfliktujaceWnioski(client, wypozyczenie) {
  const result = await client.query(
    `
    UPDATE wypozyczenia
    SET status = 'odrzucony'
    WHERE sprzet_id = $1
      AND id <> $2
      AND status IN ('oczekujacy', 'zaakceptowany')
      AND data_od <= $4
      AND data_do >= $3
    RETURNING id;
    `,
    [
      wypozyczenie.sprzet_id,
      wypozyczenie.id,
      wypozyczenie.data_od,
      wypozyczenie.data_do
    ]
  );

  return result.rows.map((wiersz) => wiersz.id);
}

async function odswiezStatusSprzetu(client, sprzetId, zachowajNaprawe = true) {
  const maAktywne = await czySprzetMaAktywneWypozyczenia(client, sprzetId);
  const status = maAktywne
    ? "wypozyczony"
    : "dostepny";

  if (!zachowajNaprawe) {
    await client.query(
      `
      UPDATE sprzety
      SET status = $1
      WHERE id = $2;
      `,
      [status, sprzetId]
    );

    return;
  }

  await client.query(
    `
    UPDATE sprzety
    SET status = $1
    WHERE id = $2
      AND status <> 'w_naprawie';
    `,
    [status, sprzetId]
  );
}

function parsujDecyzje(wartosc) {
  const decyzja = normalizujTekst(wartosc).toLowerCase();

  if (["zaakceptuj", "akceptuj", "accept", "accepted", "zaakceptowany"].includes(decyzja)) {
    return "zaakceptowany";
  }

  if (["odrzuc", "odrzucenie", "reject", "rejected", "odrzucony"].includes(decyzja)) {
    return "odrzucony";
  }

  return null;
}

router.post("/wypozycz", async (req, res) => {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const sprzetId = parsujId(req.body?.sprzet_id);
    const dataOd = parsujDate(req.body?.data_od);
    const dataDo = parsujDate(req.body?.data_do);

    if (!sprzetId || !dataOd || !dataDo || dataDo < dataOd) {
      return res.status(400).json({
        error: "Nieprawidlowe dane wypozyczenia."
      });
    }

    await client.query("BEGIN");

    const sprzet = await pobierzSprzetDoAktualizacji(client, sprzetId);

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
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
      INSERT INTO wypozyczenia (
        sprzet_id,
        uzytkownik_id,
        data_zlozenia,
        data_od,
        data_do,
        status
      )
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 'oczekujacy')
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [sprzetId, uzytkownik.id, dataOd, dataDo]
    );

    await client.query("COMMIT");

    return res.status(201).json(mapujWypozyczenie(result.rows[0]));
  } catch (err) {
    await client.query("ROLLBACK").catch(console.error);

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe daty wypozyczenia."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    client.release();
  }
});

async function zarzadzajWnioskiem(req, res) {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    if (!sprawdzAdmina(uzytkownik, res)) {
      return;
    }

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

    const sprzet = await pobierzSprzetDoAktualizacji(client, wypozyczenie.sprzet_id);

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const sprzetZajetyPrzezInne = nowyStatus === "zaakceptowany"
      ? await czySprzetMaAktywneWypozyczenia(client, wypozyczenie.sprzet_id, wypozyczenie.id)
      : false;

    if (nowyStatus === "zaakceptowany" && (sprzet.status !== "dostepny" || sprzetZajetyPrzezInne)) {
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
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [nowyStatus, id]
    );

    await odswiezStatusSprzetu(client, wypozyczenie.sprzet_id);

    await client.query("COMMIT");

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

router.patch("/wniosek/:id", zarzadzajWnioskiem);
router.post("/wniosek/:id", zarzadzajWnioskiem);

async function aktywujWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    if (!sprawdzAdmina(uzytkownik, res)) {
      return;
    }

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

    const sprzet = await pobierzSprzetDoAktualizacji(client, wypozyczenie.sprzet_id);

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

    const konfliktAktywnego = await pobierzAktywneKonfliktujaceWypozyczenie(client, wypozyczenie);

    if (konfliktAktywnego) {
      const odrzuconyResult = await client.query(
        `
        UPDATE wypozyczenia
        SET status = 'odrzucony'
        WHERE id = $1
        RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
        `,
        [wypozyczenie.id]
      );

      await client.query("COMMIT");

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
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [id]
    );

    const odrzuconeKonflikty = await odrzucKonfliktujaceWnioski(client, result.rows[0]);

    await client.query(
      `
      UPDATE sprzety
      SET status = 'wypozyczony'
      WHERE id = $1;
      `,
      [wypozyczenie.sprzet_id]
    );

    await client.query("COMMIT");

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

router.patch("/aktywuj/:id", aktywujWypozyczenie);
router.post("/aktywuj/:id", aktywujWypozyczenie);

async function zwrocWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

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

    if (uzytkownik.rola !== "admin" && wypozyczenie.uzytkownik_id !== uzytkownik.id) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    if (!czyStatusBlokujeSprzet(wypozyczenie.status)) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Mozna zwrocic tylko aktywne wypozyczenie."
      });
    }

    await pobierzSprzetDoAktualizacji(client, wypozyczenie.sprzet_id);

    const result = await client.query(
      `
      UPDATE wypozyczenia
      SET status = 'zwrocony',
          data_zwrotu_rzeczywista = NOW()
      WHERE id = $1
      RETURNING id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista;
      `,
      [id]
    );

    await odswiezStatusSprzetu(client, wypozyczenie.sprzet_id, false);
    await client.query("COMMIT");

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

router.patch("/zwrot/:id", zwrocWypozyczenie);
router.post("/zwrot/:id", zwrocWypozyczenie);

async function edytujWypozyczenie(req, res) {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    if (!sprawdzAdmina(uzytkownik, res)) {
      return;
    }

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

      if (!dozwoloneStatusyWypozyczen.includes(nowyStatus)) {
        return res.status(400).json({
          error: "Nieprawidlowy status wypozyczenia."
        });
      }
    }

    if (czyPolePrzekazane(body, "data_zwrotu_rzeczywista")) {
      if (body.data_zwrotu_rzeczywista === null || body.data_zwrotu_rzeczywista === "") {
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

    const obecneWypozyczenie = await pobierzWypozyczenieDoAktualizacji(client, id);

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

    const blokujePrzedZmiana = czyStatusBlokujeSprzet(obecneWypozyczenie.status);
    const blokujePoZmianie = czyStatusBlokujeSprzet(finalnyStatus);
    const czyZmianaSprzetu = finalnySprzetId !== obecneWypozyczenie.sprzet_id;

    const obecnySprzet = await pobierzSprzetDoAktualizacji(client, obecneWypozyczenie.sprzet_id);

    if (!obecnySprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono obecnego sprzetu."
      });
    }

    let finalnySprzet = obecnySprzet;

    if (czyZmianaSprzetu) {
      finalnySprzet = await pobierzSprzetDoAktualizacji(client, finalnySprzetId);

      if (!finalnySprzet) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          error: "Nie znaleziono nowego sprzetu."
        });
      }
    }

    if (blokujePoZmianie) {
      const nowySprzetZajetyPrzezInne = await czySprzetMaAktywneWypozyczenia(client, finalnySprzetId, id);

      if (nowySprzetZajetyPrzezInne || (czyZmianaSprzetu && finalnySprzet.status !== "dostepny")) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          error: "Sprzet nie jest dostepny."
        });
      }

      if (!czyZmianaSprzetu && !blokujePrzedZmiana && finalnySprzet.status !== "dostepny") {
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
      await odrzucKonfliktujaceWnioski(client, result.rows[0]);
    } else {
      await odswiezStatusSprzetu(client, finalnySprzetId, finalnyStatus !== "zwrocony");
    }

    if (czyZmianaSprzetu || (blokujePrzedZmiana && !blokujePoZmianie)) {
      await odswiezStatusSprzetu(client, obecneWypozyczenie.sprzet_id);
    }

    await client.query("COMMIT");

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

router.patch("/edytuj/:id", edytujWypozyczenie);
router.put("/edytuj/:id", edytujWypozyczenie);

export default router;


