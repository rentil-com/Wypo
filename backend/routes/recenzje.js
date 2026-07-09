import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";

const router = Router();
const limitRecenzjiNaStrone = 10;
const dozwoloneStatusyRecenzji = ["aktywna", "ukryta", "usunieta"];

function normalizujTekst(wartosc) {
  return typeof wartosc === "string" ? wartosc.trim() : "";
}

function normalizujTekstOpcjonalny(wartosc) {
  const tekst = normalizujTekst(wartosc);
  return tekst || null;
}

function czyPolePrzekazane(body, pole) {
  return Object.prototype.hasOwnProperty.call(body, pole);
}

function parsujId(wartosc) {
  if (wartosc === undefined || wartosc === null || String(wartosc).trim() === "") {
    return null;
  }

  const tekst = String(wartosc).trim();

  if (!/^\d+$/.test(tekst)) {
    return null;
  }

  const id = parseInt(tekst, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parsujGwiazdki(wartosc) {
  if (wartosc === undefined || wartosc === null || String(wartosc).trim() === "") {
    return null;
  }

  const tekst = String(wartosc).trim();

  if (!/^\d+$/.test(tekst)) {
    return null;
  }

  const gwiazdki = parseInt(tekst, 10);
  return Number.isInteger(gwiazdki) && gwiazdki >= 1 && gwiazdki <= 5 ? gwiazdki : null;
}

function mapujRecenzje(recenzja) {
  const wynik = {
    id: recenzja.id,
    uzytkownik_id: recenzja.uzytkownik_id,
    sprzet_id: recenzja.sprzet_id,
    wypozyczenie_id: recenzja.wypozyczenie_id,
    gwiazdki: recenzja.gwiazdki,
    tresc: recenzja.tresc,
    status: recenzja.status,
    data_dodania: recenzja.data_dodania
  };

  if (czyPolePrzekazane(recenzja, "imie")) {
    wynik.imie = recenzja.imie;
    wynik.nazwisko = recenzja.nazwisko;
  }

  if (czyPolePrzekazane(recenzja, "nazwa_sprzetu")) {
    wynik.nazwa_sprzetu = recenzja.nazwa_sprzetu;
  }

  return wynik;
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

async function pobierzSprzet(sprzetId) {
  const result = await pool.query(
    `
    SELECT id
    FROM sprzety
    WHERE id = $1
    LIMIT 1;
    `,
    [sprzetId]
  );

  return result.rows[0] || null;
}

async function pobierzRecenzjePoId(id) {
  const result = await pool.query(
    `
    SELECT
      r.id,
      r.uzytkownik_id,
      r.sprzet_id,
      r.wypozyczenie_id,
      r.gwiazdki,
      r.tresc,
      r.status,
      r.data_dodania,
      u.imie,
      u.nazwisko,
      s.nazwa AS nazwa_sprzetu
    FROM recenzje r
    JOIN uzytkownicy u
      ON u.id = r.uzytkownik_id
    JOIN sprzety s
      ON s.id = r.sprzet_id
    WHERE r.id = $1
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function pobierzListeRecenzji(where, params, strona) {
  const offset = (strona - 1) * limitRecenzjiNaStrone;
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  const result = await pool.query(
    `
    SELECT
      r.id,
      r.uzytkownik_id,
      r.sprzet_id,
      r.wypozyczenie_id,
      r.gwiazdki,
      r.tresc,
      r.status,
      r.data_dodania,
      u.imie,
      u.nazwisko,
      s.nazwa AS nazwa_sprzetu
    FROM recenzje r
    JOIN uzytkownicy u
      ON u.id = r.uzytkownik_id
    JOIN sprzety s
      ON s.id = r.sprzet_id
    ${whereSql}
    ORDER BY r.data_dodania DESC, r.id DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
    `,
    [...params, limitRecenzjiNaStrone, offset]
  );

  const countResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM recenzje r
    ${whereSql};
    `,
    params
  );

  const total = Number(countResult.rows[0].total);

  return {
    total,
    liczbaStron: Math.ceil(total / limitRecenzjiNaStrone),
    dane: result.rows.map(mapujRecenzje)
  };
}

async function pobierzZwroconeWypozyczenie(uzytkownikId, sprzetId) {
  const result = await pool.query(
    `
    SELECT id, status
    FROM wypozyczenia
    WHERE uzytkownik_id = $1
      AND sprzet_id = $2
      AND status = 'zwrocony'
    ORDER BY data_zwrotu_rzeczywista DESC NULLS LAST, id DESC
    LIMIT 1;
    `,
    [uzytkownikId, sprzetId]
  );

  return result.rows[0] || null;
}

async function pobierzWypozyczenieRecenzji(wypozyczenieId, uzytkownikId, sprzetId) {
  const result = await pool.query(
    `
    SELECT id, status
    FROM wypozyczenia
    WHERE id = $1
      AND uzytkownik_id = $2
      AND sprzet_id = $3
    LIMIT 1;
    `,
    [wypozyczenieId, uzytkownikId, sprzetId]
  );

  return result.rows[0] || null;
}
router.post("/dodaj", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const body = req.body || {};
    const sprzetId = parsujId(body.sprzet_id);
    const gwiazdki = parsujGwiazdki(body.gwiazdki);
    const tresc = normalizujTekstOpcjonalny(body.tresc);
    let wypozyczenieId = null;

    if (!sprzetId || !gwiazdki) {
      return res.status(400).json({
        error: "Nieprawidlowe dane recenzji."
      });
    }

    if (
      czyPolePrzekazane(body, "wypozyczenie_id") &&
      body.wypozyczenie_id !== null &&
      String(body.wypozyczenie_id).trim() !== ""
    ) {
      wypozyczenieId = parsujId(body.wypozyczenie_id);

      if (!wypozyczenieId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID wypozyczenia."
        });
      }
    }

    const sprzet = await pobierzSprzet(sprzetId);

    if (!sprzet) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const istniejacaRecenzja = await pool.query(
      `
      SELECT id
      FROM recenzje
      WHERE uzytkownik_id = $1
        AND sprzet_id = $2
        AND status != 'usunieta'::status_recenzji
      LIMIT 1;
      `,
      [uzytkownik.id, sprzetId]
    );

    if (istniejacaRecenzja.rows.length > 0) {
      return res.status(409).json({
        error: "Uzytkownik dodal juz recenzje tego sprzetu."
      });
    }

    if (wypozyczenieId) {
      const wypozyczenie = await pobierzWypozyczenieRecenzji(wypozyczenieId, uzytkownik.id, sprzetId);

      if (!wypozyczenie) {
        return res.status(404).json({
          error: "Nie znaleziono wypozyczenia dla tego uzytkownika i sprzetu."
        });
      }

      if (wypozyczenie.status !== "zwrocony") {
        return res.status(409).json({
          error: "Recenzje mozna dodac tylko po zwroconym wypozyczeniu."
        });
      }
    } else {
      const zwroconeWypozyczenie = await pobierzZwroconeWypozyczenie(uzytkownik.id, sprzetId);

      if (!zwroconeWypozyczenie) {
        return res.status(409).json({
          error: "Recenzje mozna dodac tylko po zwroconym wypozyczeniu."
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO recenzje (
        uzytkownik_id,
        sprzet_id,
        wypozyczenie_id,
        gwiazdki,
        tresc
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, uzytkownik_id, sprzet_id, wypozyczenie_id, gwiazdki, tresc, status, data_dodania;
      `,
      [uzytkownik.id, sprzetId, wypozyczenieId, gwiazdki, tresc]
    );

    return res.status(201).json(mapujRecenzje(result.rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Uzytkownik dodal juz recenzje tego sprzetu."
      });
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono powiazanych danych."
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe dane recenzji."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/sprzet/:id", async (req, res) => {
  try {
    const sprzetId = parsujId(req.params.id);

    if (!sprzetId) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const sprzet = await pobierzSprzet(sprzetId);

    if (!sprzet) {
      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * limitRecenzjiNaStrone;

    const podsumowanieResult = await pool.query(
      `
      SELECT
        COALESCE(AVG(gwiazdki), 0) AS srednia_ocen,
        COUNT(*) AS liczba_recenzji
      FROM recenzje
      WHERE sprzet_id = $1
        AND status = 'aktywna';
      `,
      [sprzetId]
    );

    const liczbaRecenzji = Number(podsumowanieResult.rows[0].liczba_recenzji);
    const sredniaOcen = Number(Number(podsumowanieResult.rows[0].srednia_ocen).toFixed(2));
    const liczbaStron = Math.ceil(liczbaRecenzji / limitRecenzjiNaStrone);

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.uzytkownik_id,
        r.sprzet_id,
        r.wypozyczenie_id,
        r.gwiazdki,
        r.tresc,
        r.status,
        r.data_dodania,
        u.imie,
        u.nazwisko
      FROM recenzje r
      JOIN uzytkownicy u
        ON u.id = r.uzytkownik_id
      WHERE r.sprzet_id = $1
        AND r.status = 'aktywna'
      ORDER BY r.data_dodania DESC, r.id DESC
      LIMIT $2 OFFSET $3;
      `,
      [sprzetId, limitRecenzjiNaStrone, offset]
    );

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone,
      sprzet_id: sprzetId,
      srednia_ocen: sredniaOcen,
      liczba_recenzji: liczbaRecenzji,
      total: liczbaRecenzji,
      liczbaStron,
      dane: result.rows.map(mapujRecenzje)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});
router.get("/moje", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const strona = parsujId(req.query.strona) || 1;
    const where = [
      "r.uzytkownik_id = $1",
      "r.status = 'aktywna'::status_recenzji"
    ];
    const params = [uzytkownik.id];

    const lista = await pobierzListeRecenzji(where, params, strona);

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone,
      filtry,
      total: lista.total,
      liczbaStron: lista.liczbaStron,
      dane: lista.dane
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    if (!sprawdzAdmina(uzytkownik, res)) {
      return;
    }

    const strona = parsujId(req.query.strona) || 1;
    const where = [];
    const params = [];
    const filtry = {
      uzytkownik_id: null,
      sprzet_id: null,
      status: null,
      gwiazdki: null
    };

    if (czyPolePrzekazane(req.query, "uzytkownik_id")) {
      const uzytkownikId = parsujId(req.query.uzytkownik_id);

      if (!uzytkownikId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID uzytkownika."
        });
      }

      params.push(uzytkownikId);
      where.push(`r.uzytkownik_id = $${params.length}`);
      filtry.uzytkownik_id = uzytkownikId;
    }

    if (czyPolePrzekazane(req.query, "sprzet_id")) {
      const sprzetId = parsujId(req.query.sprzet_id);

      if (!sprzetId) {
        return res.status(400).json({
          error: "Nieprawidlowe ID sprzetu."
        });
      }

      params.push(sprzetId);
      where.push(`r.sprzet_id = $${params.length}`);
      filtry.sprzet_id = sprzetId;
    }

    if (czyPolePrzekazane(req.query, "status")) {
      const status = normalizujTekst(req.query.status);

      if (!dozwoloneStatusyRecenzji.includes(status)) {
        return res.status(400).json({
          error: "Nieprawidlowy status recenzji."
        });
      }

      params.push(status);
      where.push(`r.status = $${params.length}::status_recenzji`);
      filtry.status = status;
    }

    if (czyPolePrzekazane(req.query, "gwiazdki")) {
      const gwiazdki = parsujGwiazdki(req.query.gwiazdki);

      if (!gwiazdki) {
        return res.status(400).json({
          error: "Nieprawidlowa liczba gwiazdek."
        });
      }

      params.push(gwiazdki);
      where.push(`r.gwiazdki = $${params.length}`);
      filtry.gwiazdki = gwiazdki;
    }

    const lista = await pobierzListeRecenzji(where, params, strona);

    return res.status(200).json({
      strona,
      limitRecenzjiNaStrone,
      filtry,
      total: lista.total,
      liczbaStron: lista.liczbaStron,
      dane: lista.dane
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});
async function ustawStatusWidocznosciRecenzji(req, res, status) {
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
        error: "Nieprawidlowe ID recenzji."
      });
    }

    const recenzja = await pobierzRecenzjePoId(id);

    if (!recenzja) {
      return res.status(404).json({
        error: "Nie znaleziono recenzji."
      });
    }

    if (recenzja.status === "usunieta") {
      return res.status(400).json({
        error: "Nie mozna zmienic widocznosci usunietej recenzji."
      });
    }

    const result = await pool.query(
      `
      UPDATE recenzje
      SET status = $2::status_recenzji
      WHERE id = $1
      RETURNING id, uzytkownik_id, sprzet_id, wypozyczenie_id, gwiazdki, tresc, status, data_dodania;
      `,
      [id, status]
    );

    return res.status(200).json(mapujRecenzje(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
}

function ukryjRecenzje(req, res) {
  return ustawStatusWidocznosciRecenzji(req, res, "ukryta");
}

function odkryjRecenzje(req, res) {
  return ustawStatusWidocznosciRecenzji(req, res, "aktywna");
}

router.patch("/ukryj/:id", ukryjRecenzje);
router.put("/ukryj/:id", ukryjRecenzje);
router.patch("/odkryj/:id", odkryjRecenzje);
router.put("/odkryj/:id", odkryjRecenzje);

router.delete("/usun/:id", async (req, res) => {
  try {
    const uzytkownik = await pobierzZalogowanego(req, res);

    if (!uzytkownik) {
      return;
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID recenzji."
      });
    }

    const recenzja = await pobierzRecenzjePoId(id);
    
    if (!recenzja || recenzja.status === 'usunieta') {
      return res.status(404).json({
        error: "Nie znaleziono recenzji."
      });
    }

    const czyAdmin = uzytkownik.rola === "admin";

    if (!czyAdmin && recenzja.uzytkownik_id !== uzytkownik.id) {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const result = await pool.query(
      `
      UPDATE recenzje
      SET status = 'usunieta'
      WHERE id = $1
      RETURNING id, uzytkownik_id, sprzet_id, wypozyczenie_id, gwiazdki, tresc, status, data_dodania;
      `,
      [id]
    );

    return res.status(200).json(mapujRecenzje(result.rows[0]));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID recenzji."
      });
    }

    const recenzja = await pobierzRecenzjePoId(id);

    if (!recenzja) {
      return res.status(404).json({
        error: "Nie znaleziono recenzji."
      });
    }

    if (recenzja.status !== "aktywna") {
      const uzytkownik = await pobierzUzytkownikaZSesji(req);

      if (!uzytkownik) {
        return res.status(404).json({
          error: "Nie znaleziono recenzji."
        });
      }

      const czyAdmin = uzytkownik.rola === "admin";

      if (!czyAdmin && recenzja.uzytkownik_id !== uzytkownik.id) {
        return res.status(403).json({
          error: "Brak uprawnien."
        });
      }
    }

    return res.status(200).json(mapujRecenzje(recenzja));
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;