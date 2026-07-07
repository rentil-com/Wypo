import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import crypto from "crypto";
import 'dotenv/config';

const limitPrzedmiotowNaStrone = 20;
const MAKSYMALNA_CENA = 99999999.99;

const router = Router();
const dozwoloneStatusy = ["dostepny", "wypozyczony", "w_naprawie"];
const dozwoloneTypyZdjec = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const s3Endpoint = process.env.S3_ENDPOINT_API || process.env.S3_ENDPOINT;
const s3AccessKey = process.env.S3_API_KEY || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const s3SecretKey = process.env.S3_API_SECRET || process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const s3Bucket = process.env.S3_BUCKET;
const s3Folder = process.env.S3_ITEMS_IMAGES || "items/images/";
const s3Config = {
  region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
  endpoint: s3Endpoint || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
};

if (s3AccessKey && s3SecretKey) {
  s3Config.credentials = {
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey
  };
}

const s3Client = new S3Client(s3Config);

function czyS3Skonfigurowane() {
  return s3Bucket && s3AccessKey && s3SecretKey;
}

function folderS3() {
  return s3Folder.endsWith("/")
    ? s3Folder
    : s3Folder + "/";
}

function rozszerzeniePliku(nazwaPliku) {
  const czesci = nazwaPliku.split(".");

  if (czesci.length < 2) {
    return "";
  }

  return "." + czesci.pop().toLowerCase();
}

function kluczZdjecia(plik) {
  return `${folderS3()}${crypto.randomUUID()}${rozszerzeniePliku(plik.originalname)}`;
}

function pobierzKluczS3(zdjecie_url) {
  if (!zdjecie_url) {
    return null;
  }

  if (process.env.S3_WEB_ENDPOINT && zdjecie_url.startsWith(process.env.S3_WEB_ENDPOINT)) {
    return zdjecie_url.replace(process.env.S3_WEB_ENDPOINT, "").replace(/^\/+/, "");
  }

  if (/^https?:\/\//i.test(zdjecie_url)) {
    return null;
  }

  return zdjecie_url;
}

function formatujUrlZdjecia(zdjecie_url) {
  if (!zdjecie_url) {
    return null;
  }

  if (/^https?:\/\//i.test(zdjecie_url)) {
    return zdjecie_url;
  }

  if (!process.env.S3_WEB_ENDPOINT) {
    return zdjecie_url;
  }

  return `${process.env.S3_WEB_ENDPOINT.replace(/\/+$/, "")}/${zdjecie_url.replace(/^\/+/, "")}`;
}

function normalizujTekst(wartosc) {
  return typeof wartosc === "string"
    ? wartosc.trim()
    : "";
}

function normalizujTekstOpcjonalny(wartosc) {
  const tekst = normalizujTekst(wartosc);
  return tekst || null;
}

function parsujId(wartosc) {
  const id = Number(wartosc);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function czyPolePrzekazane(body, pole) {
  return Object.prototype.hasOwnProperty.call(body, pole);
}

function parsujCene(wartosc, wymagana = false) {
  if (wartosc === undefined || wartosc === null || String(wartosc).trim() === "") {
    return wymagana
      ? { poprawna: false }
      : { poprawna: true, wartosc: null };
  }

  const tekst = String(wartosc).trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(tekst)) {
    return { poprawna: false };
  }

  const cena = Number(tekst);

  if (!Number.isFinite(cena) || cena < 0 || cena > MAKSYMALNA_CENA) {
    return { poprawna: false };
  }

  return { poprawna: true, wartosc: cena };
}

function parsujUrlZdjecia(wartosc) {
  const url = normalizujTekstOpcjonalny(wartosc);

  if (!url) {
    return { poprawna: true, wartosc: null };
  }

  try {
    const parsed = new URL(url);
    const poprawnyProtokol = parsed.protocol === "http:" || parsed.protocol === "https:";

    return poprawnyProtokol
      ? { poprawna: true, wartosc: url }
      : { poprawna: false };
  } catch {
    return { poprawna: false };
  }
}

function czyPoprawnyPlikZdjecia(plik) {
  return !plik || dozwoloneTypyZdjec.includes(plik.mimetype);
}

function mapujSprzet(sprzet, czyAdmin) {
  return {
    ...sprzet,
    cena: Number(sprzet.cena),
    cena_po_promocji: sprzet.cena_po_promocji === null
      ? null
      : Number(sprzet.cena_po_promocji),
    status: czyAdmin
      ? sprzet.status
      : sprzet.status === "dostepny"
        ? "dostepny"
        : "niedostepny",
    zdjecie_url: formatujUrlZdjecia(sprzet.zdjecie_url)
  };
}

async function dodajZdjecieDoS3(plik) {
  if (!czyS3Skonfigurowane()) {
    throw new Error("Brak konfiguracji S3.");
  }

  const key = kluczZdjecia(plik);

  await s3Client.send(new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: plik.buffer,
    ContentType: plik.mimetype
  }));

  return key;
}

async function usunZdjecieZS3(zdjecie_url) {
  const key = pobierzKluczS3(zdjecie_url);

  if (!key) {
    return;
  }

  if (!czyS3Skonfigurowane()) {
    throw new Error("Brak konfiguracji S3.");
  }

  await s3Client.send(new DeleteObjectCommand({
    Bucket: s3Bucket,
    Key: key
  }));
}

router.post("/dodaj", upload.single("zdjecie"), async (req, res) => {
  let zdjecie_url = null;

  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const nazwa = normalizujTekst(req.body.nazwa);
    const opis = normalizujTekstOpcjonalny(req.body.opis);
    const kategoria_id = parsujId(req.body.kategoria_id);
    const status = req.body.status || "dostepny";
    const cena = parsujCene(req.body.cena, true);
    const cenaPoPromocji = parsujCene(req.body.cena_po_promocji);
    const urlZdjecia = parsujUrlZdjecia(req.body.zdjecie_url);
    zdjecie_url = urlZdjecia.wartosc || null;

    if (
      !nazwa ||
      nazwa.length > 100 ||
      !kategoria_id ||
      !dozwoloneStatusy.includes(status) ||
      !cena.poprawna ||
      !cenaPoPromocji.poprawna ||
      (cenaPoPromocji.wartosc !== null && cenaPoPromocji.wartosc > cena.wartosc) ||
      !urlZdjecia.poprawna ||
      !czyPoprawnyPlikZdjecia(req.file)
    ) {
      return res.status(400).json({
        error: "Nieprawidlowe dane sprzetu."
      });
    }

    if (req.file) {
      zdjecie_url = await dodajZdjecieDoS3(req.file);
    }

    const result = await pool.query(
      `
      INSERT INTO sprzety (
        nazwa,
        opis,
        kategoria_id,
        zdjecie_url,
        cena,
        cena_po_promocji,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nazwa, opis, kategoria_id, zdjecie_url, cena, cena_po_promocji, status;
      `,
      [nazwa, opis, kategoria_id, zdjecie_url, cena.wartosc, cenaPoPromocji.wartosc, status]
    );

    return res.status(201).json(mapujSprzet(result.rows[0], true));
  } catch (err) {
    if (req.file && zdjecie_url) {
      await usunZdjecieZS3(zdjecie_url).catch(console.error);
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono kategorii."
      });
    }

    if (err.message === "Brak konfiguracji S3.") {
      return res.status(500).json({
        error: "Brak konfiguracji S3."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

async function edytujSprzet(req, res) {
  let client = null;
  let zdjecieDodaneDoS3 = null;
  let poprzednieZdjecieDoUsuniecia = null;
  let transakcjaAktywna = false;
  let transakcjaZatwierdzona = false;

  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    const body = req.body || {};
    const pola = [];
    const params = [];
    let cena = null;
    let cenaPoPromocji = null;
    let nowyKluczZdjecia = null;

    if (czyPolePrzekazane(body, "nazwa")) {
      const nazwa = normalizujTekst(body.nazwa);

      if (!nazwa || nazwa.length > 100) {
        return res.status(400).json({
          error: "Nieprawidlowa nazwa sprzetu."
        });
      }

      params.push(nazwa);
      pola.push(`nazwa = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "opis")) {
      const opis = normalizujTekstOpcjonalny(body.opis);

      params.push(opis);
      pola.push(`opis = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "kategoria_id")) {
      const kategoria_id = parsujId(body.kategoria_id);

      if (!kategoria_id) {
        return res.status(400).json({
          error: "Nieprawidlowa kategoria sprzetu."
        });
      }

      params.push(kategoria_id);
      pola.push(`kategoria_id = $${params.length}`);
    }

    if (czyPolePrzekazane(body, "status")) {
      const status = normalizujTekst(body.status);

      if (!dozwoloneStatusy.includes(status)) {
        return res.status(400).json({
          error: "Nieprawidlowy status sprzetu."
        });
      }

      params.push(status);
      pola.push(`status = $${params.length}`);
    }

    const czyZmianaCeny =
      czyPolePrzekazane(body, "cena") ||
      czyPolePrzekazane(body, "cena_po_promocji");

    if (czyPolePrzekazane(body, "cena")) {
      cena = parsujCene(body.cena, true);

      if (!cena.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowa cena sprzetu."
        });
      }
    }

    if (czyPolePrzekazane(body, "cena_po_promocji")) {
      cenaPoPromocji = parsujCene(body.cena_po_promocji);

      if (!cenaPoPromocji.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowa cena promocyjna sprzetu."
        });
      }
    }

    if (req.file) {
      if (!czyPoprawnyPlikZdjecia(req.file)) {
        return res.status(400).json({
          error: "Nieprawidlowy plik zdjecia."
        });
      }

      zdjecieDodaneDoS3 = await dodajZdjecieDoS3(req.file);
      nowyKluczZdjecia = zdjecieDodaneDoS3;
      params.push(zdjecieDodaneDoS3);
      pola.push(`zdjecie_url = $${params.length}`);
    } else if (czyPolePrzekazane(body, "zdjecie_url")) {
      const urlZdjecia = parsujUrlZdjecia(body.zdjecie_url);

      if (!urlZdjecia.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowy URL zdjecia."
        });
      }

      params.push(urlZdjecia.wartosc);
      pola.push(`zdjecie_url = $${params.length}`);
      nowyKluczZdjecia = pobierzKluczS3(urlZdjecia.wartosc);
    }

    if (pola.length === 0 && !czyZmianaCeny) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT cena, cena_po_promocji, zdjecie_url
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      if (zdjecieDodaneDoS3) {
        await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
        zdjecieDodaneDoS3 = null;
      }

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const obecnySprzet = obecnyResult.rows[0];

    if (czyZmianaCeny) {
      const aktualnaCena = cena
        ? cena.wartosc
        : Number(obecnySprzet.cena);
      const aktualnaCenaPoPromocji = cenaPoPromocji
        ? cenaPoPromocji.wartosc
        : obecnySprzet.cena_po_promocji === null
          ? null
          : Number(obecnySprzet.cena_po_promocji);

      if (aktualnaCenaPoPromocji !== null && aktualnaCenaPoPromocji > aktualnaCena) {
        await client.query("ROLLBACK");
        transakcjaAktywna = false;

        if (zdjecieDodaneDoS3) {
          await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
          zdjecieDodaneDoS3 = null;
        }

        return res.status(400).json({
          error: "Cena promocyjna nie moze byc wieksza od ceny."
        });
      }

      if (cena) {
        params.push(cena.wartosc);
        pola.push(`cena = $${params.length}`);
      }

      if (cenaPoPromocji) {
        params.push(cenaPoPromocji.wartosc);
        pola.push(`cena_po_promocji = $${params.length}`);
      }
    }

    if (req.file || czyPolePrzekazane(body, "zdjecie_url")) {
      const poprzedniKluczZdjecia = pobierzKluczS3(obecnySprzet.zdjecie_url);

      if (poprzedniKluczZdjecia && poprzedniKluczZdjecia !== nowyKluczZdjecia) {
        poprzednieZdjecieDoUsuniecia = obecnySprzet.zdjecie_url;
      }
    }

    params.push(id);

    const result = await client.query(
      `
      UPDATE sprzety
      SET ${pola.join(", ")}
      WHERE id = $${params.length}
      RETURNING id, nazwa, opis, kategoria_id, status, zdjecie_url, cena, cena_po_promocji;
      `,
      params
    );

    await client.query("COMMIT");
    transakcjaAktywna = false;
    transakcjaZatwierdzona = true;

    if (poprzednieZdjecieDoUsuniecia) {
      await usunZdjecieZS3(poprzednieZdjecieDoUsuniecia);
    }

    zdjecieDodaneDoS3 = null;

    return res.status(200).json(mapujSprzet(result.rows[0], true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    if (!transakcjaZatwierdzona && zdjecieDodaneDoS3) {
      await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
    }

    if (err.code === "23503") {
      return res.status(400).json({
        error: "Nie znaleziono kategorii."
      });
    }

    if (err.code === "23514") {
      return res.status(400).json({
        error: "Nieprawidlowe dane sprzetu."
      });
    }

    if (err.message === "Brak konfiguracji S3.") {
      return res.status(500).json({
        error: "Brak konfiguracji S3."
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

router.patch("/edit/:id", upload.single("zdjecie"), edytujSprzet);
router.put("/edit/:id", upload.single("zdjecie"), edytujSprzet);

router.delete("/usun/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const id = parsujId(req.params.id);

    if (!id) {
      return res.status(400).json({
        error: "Nieprawidlowe ID sprzetu."
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      DELETE FROM sprzety
      WHERE id = $1
      RETURNING id, nazwa, opis, kategoria_id, status, zdjecie_url, cena, cena_po_promocji;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    await usunZdjecieZS3(result.rows[0].zdjecie_url);
    await client.query("COMMIT");

    return res.status(200).json(mapujSprzet(result.rows[0], true));
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23503") {
      return res.status(409).json({
        error: "Nie mozna usunac sprzetu, do ktorego przypisane jest wypozyczenie."
      });
    }

    if (err.message === "Brak konfiguracji S3.") {
      return res.status(500).json({
        error: "Brak konfiguracji S3."
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

router.get("/usun", async (req, res) => {
  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
      return res.status(403).json({
        error: "Brak uprawnien."
      });
    }

    const result = await pool.query(
      `
      SELECT id
      FROM sprzety s
      WHERE NOT EXISTS (
        SELECT 1
        FROM wypozyczenia w
        WHERE w.sprzet_id = s.id
      )
      ORDER BY id;
      `
    );

    const dane = result.rows.map((sprzet) => sprzet.id);

    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);
    const czyAdmin = uzytkownik?.rola === "admin";

    const strona = parsujId(req.query.strona) || 1;
    const offset = (strona - 1) * limitPrzedmiotowNaStrone;

    const kategoria = req.query.kategoria
      ? parsujId(req.query.kategoria)
      : null;

    const status = dozwoloneStatusy.includes(req.query.status)
      ? req.query.status
      : null;
    let zastosowanyStatus = null;

    const where = [];
    const whereParams = [];

    // Jeśli kategoria jest niepoprawna, ignorujemy ją
    if (kategoria) {
      whereParams.push(kategoria);
      where.push(`kategoria_id = $${whereParams.length}`);
    }

    // Status filtrujemy tylko, jeśli jest poprawny
    if (status && dozwoloneStatusy.includes(status)) {
      if (czyAdmin) {
        // Admin może filtrować po każdym statusie
        whereParams.push(status);
        where.push(`status = $${whereParams.length}`);
        zastosowanyStatus = status;
      } else if (status === "dostepny") {
        // User może filtrować tylko po dostępnych
        whereParams.push("dostepny");
        where.push(`status = $${whereParams.length}`);
        zastosowanyStatus = "dostepny";
      }

      // Jeśli user poda np. status=w_naprawie,
      // to nic nie robimy, czyli filtr jest ignorowany
    }

    const whereSql = where.length > 0
      ? `WHERE ${where.join(" AND ")}`
      : "";

    const resultParams = [
      ...whereParams,
      limitPrzedmiotowNaStrone,
      offset
    ];

    const limitIndex = whereParams.length + 1;
    const offsetIndex = whereParams.length + 2;

    const result = await pool.query(
      `
      SELECT 
        id,
        nazwa,
        opis,
        kategoria_id,
        status,
        zdjecie_url,
        cena,
        cena_po_promocji
      FROM sprzety
      ${whereSql}
      ORDER BY id
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
    const liczbaStron = Math.ceil(total / limitPrzedmiotowNaStrone);

    const dane = result.rows.map((sprzet) => mapujSprzet(sprzet, czyAdmin));

    return res.status(200).json({
      strona,
      limitPrzedmiotowNaStrone,
      kategoria,
      status: zastosowanyStatus,
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

router.get("/:id", async (req, res) => {
    try {
        const uzytkownik = await pobierzUzytkownikaZSesji(req);
        const czyAdmin = uzytkownik?.rola === "admin";

        const id = parsujId(req.params.id);

        if (!id) {
            return res.status(400).json({
                error: "Nieprawidłowe ID sprzętu."
            });
        }

        const result = await pool.query(
            `
            SELECT id, nazwa, opis, kategoria_id, status, zdjecie_url, cena, cena_po_promocji
            FROM sprzety
            WHERE id = $1;
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Nie znaleziono sprzętu."
            });
        }

        const sprzet = result.rows[0];

        return res.status(200).json(mapujSprzet(sprzet, czyAdmin));
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: "Błąd serwera"
        });
    }
});

export default router;
