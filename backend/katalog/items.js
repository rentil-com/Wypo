import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import crypto from "crypto";
import 'dotenv/config';

const limitPrzedmiotowNaStrone = 20;
const limitWynikowWyszukiwania = 5;
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

function czyZwyklyObiekt(wartosc) {
  return wartosc && typeof wartosc === "object" && !Array.isArray(wartosc);
}

function czyObiektZdjec(wartosc) {
  return czyZwyklyObiekt(wartosc);
}

function uporzadkujZdjeciaUrl(zdjecia_url) {
  if (!czyObiektZdjec(zdjecia_url)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(zdjecia_url)
      .sort(([pierwszy], [drugi]) => Number(pierwszy) - Number(drugi))
  );
}

function formatujZdjeciaUrl(zdjecia_url) {
  const zdjecia = uporzadkujZdjeciaUrl(zdjecia_url);

  return Object.fromEntries(
    Object.entries(zdjecia).map(([numer, url]) => [numer, formatujUrlZdjecia(url)])
  );
}

function pobierzPierwszeZdjecieUrl(zdjecia_url) {
  return Object.values(formatujZdjeciaUrl(zdjecia_url))
    .find((url) => Boolean(url)) ?? null;
}

function formatujSpecyfikacje(specyfikacje) {
  if (!Array.isArray(specyfikacje)) {
    return [];
  }

  return specyfikacje.map((specyfikacja) => ({
    id: Number(specyfikacja.id),
    nazwa_specyfikacji: specyfikacja.nazwa_specyfikacji,
    opis_specyfikacji: specyfikacja.opis_specyfikacji,
    emotka_specyfikacji: specyfikacja.emotka_specyfikacji
  }));
}

function podstawowePolaSprzetuSql(alias = "s") {
  return `
        ${alias}.id,
        ${alias}.nazwa,
        ${alias}.opis,
        ${alias}.kategoria_id,
        ${alias}.status,
        ${alias}.zdjecia_url,
        ${alias}.cena,
        ${alias}.cena_po_promocji`;
}

function polaSprzetuSql(alias = "s") {
  return `
        ${podstawowePolaSprzetuSql(alias)},
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', spec.id,
              'nazwa_specyfikacji', spec.nazwa_specyfikacji,
              'opis_specyfikacji', spec.opis_specyfikacji,
              'emotka_specyfikacji', spec.emotka_specyfikacji
            )
          )
          FROM (
            SELECT id, nazwa_specyfikacji, opis_specyfikacji, emotka_specyfikacji
            FROM specyfikacje_sprzetu
            WHERE sprzet_id = ${alias}.id
            ORDER BY kolejnosc, id
          ) spec
        ), '[]'::jsonb) AS specyfikacje`;
}

function nastepnyNumerZdjecia(zdjecia_url) {
  const numery = Object.keys(uporzadkujZdjeciaUrl(zdjecia_url))
    .map((numer) => Number(numer))
    .filter((numer) => Number.isInteger(numer) && numer > 0);

  return numery.length > 0
    ? Math.max(...numery) + 1
    : 1;
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

function parsujFiltrCeny(wartosc) {
  const cena = parsujCene(wartosc);

  return cena.poprawna && cena.wartosc !== null
    ? cena.wartosc
    : null;
}

function parsujBoolean(wartosc) {
  if (typeof wartosc !== "string") {
    return false;
  }

  return ["1", "true", "tak", "yes"].includes(wartosc.trim().toLowerCase());
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

function parsujSpecyfikacje(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return { poprawna: true, wartosc: [] };
  }

  let specyfikacje = wartosc;

  if (typeof wartosc === "string") {
    try {
      specyfikacje = JSON.parse(wartosc);
    } catch {
      return { poprawna: false };
    }
  }

  if (!Array.isArray(specyfikacje)) {
    return { poprawna: false };
  }

  const wynik = [];

  for (const specyfikacja of specyfikacje) {
    if (!czyZwyklyObiekt(specyfikacja)) {
      return { poprawna: false };
    }

    const nazwa_specyfikacji = normalizujTekst(specyfikacja.nazwa_specyfikacji);
    const opis_specyfikacji = normalizujTekst(specyfikacja.opis_specyfikacji);
    const emotka_specyfikacji = normalizujTekstOpcjonalny(specyfikacja.emotka_specyfikacji);

    if (
      !nazwa_specyfikacji ||
      nazwa_specyfikacji.length > 100 ||
      !opis_specyfikacji ||
      (emotka_specyfikacji && emotka_specyfikacji.length > 100)
    ) {
      return { poprawna: false };
    }

    wynik.push({
      nazwa_specyfikacji,
      opis_specyfikacji,
      emotka_specyfikacji
    });
  }

  return { poprawna: true, wartosc: wynik };
}

function pobierzSpecyfikacjeZBody(body) {
  if (czyPolePrzekazane(body, "specyfikacje")) {
    return {
      przekazane: true,
      wartosc: body.specyfikacje
    };
  }

  if (czyPolePrzekazane(body, "specyfikacja")) {
    return {
      przekazane: true,
      wartosc: body.specyfikacja
    };
  }

  return {
    przekazane: false,
    wartosc: undefined
  };
}

function parsujZdjeciaUrl(wartosc, wymagane = false) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return wymagane
      ? { poprawna: false }
      : { poprawna: true, wartosc: {} };
  }

  let zdjecia = wartosc;

  if (typeof wartosc === "string") {
    try {
      zdjecia = JSON.parse(wartosc);
    } catch {
      return { poprawna: false };
    }
  }

  if (!czyObiektZdjec(zdjecia)) {
    return { poprawna: false };
  }

  const wynik = {};

  for (const [numer, url] of Object.entries(zdjecia)) {
    const numerZdjecia = Number(numer);

    if (!Number.isInteger(numerZdjecia) || numerZdjecia <= 0 || String(numerZdjecia) !== String(numer).trim()) {
      return { poprawna: false };
    }

    const urlZdjecia = parsujUrlZdjecia(url);

    if (!urlZdjecia.poprawna || !urlZdjecia.wartosc) {
      return { poprawna: false };
    }

    wynik[String(numerZdjecia)] = urlZdjecia.wartosc;
  }

  if (wymagane && Object.keys(wynik).length === 0) {
    return { poprawna: false };
  }

  return { poprawna: true, wartosc: uporzadkujZdjeciaUrl(wynik) };
}

function parsujListeUrlZdjec(wartosc) {
  if (
    wartosc === undefined ||
    wartosc === null ||
    (typeof wartosc === "string" && wartosc.trim() === "")
  ) {
    return { poprawna: true, wartosc: [] };
  }

  let zdjecia = wartosc;

  if (typeof wartosc === "string") {
    try {
      zdjecia = JSON.parse(wartosc);
    } catch {
      zdjecia = [wartosc];
    }
  }

  if (!Array.isArray(zdjecia)) {
    return { poprawna: false };
  }

  const wynik = [];

  for (const url of zdjecia) {
    const urlZdjecia = parsujUrlZdjecia(url);

    if (!urlZdjecia.poprawna || !urlZdjecia.wartosc) {
      return { poprawna: false };
    }

    wynik.push(urlZdjecia.wartosc);
  }

  return { poprawna: true, wartosc: wynik };
}

function parsujNumeryZdjec(wartosc) {
  if (wartosc === undefined || wartosc === null || (typeof wartosc === "string" && wartosc.trim() === "")) {
    return { poprawna: false };
  }

  let dane = wartosc;

  if (typeof wartosc === "string") {
    const tekst = wartosc.trim();

    try {
      dane = JSON.parse(tekst);
    } catch {
      dane = tekst.split(",").map((numer) => numer.trim());
    }
  }

  const numery = czyObiektZdjec(dane)
    ? Object.keys(dane)
    : Array.isArray(dane)
      ? dane
      : [dane];
  const wynik = [];

  for (const numer of numery) {
    const numerZdjecia = Number(numer);

    if (!Number.isInteger(numerZdjecia) || numerZdjecia <= 0) {
      return { poprawna: false };
    }

    const klucz = String(numerZdjecia);

    if (!wynik.includes(klucz)) {
      wynik.push(klucz);
    }
  }

  return wynik.length > 0
    ? { poprawna: true, wartosc: wynik }
    : { poprawna: false };
}

function plikiZdjec(req) {
  if (req.file) {
    return [req.file];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }

  return [];
}

function czyPoprawnyPlikZdjecia(plik) {
  return !plik || dozwoloneTypyZdjec.includes(plik.mimetype);
}

function czyPoprawnePlikiZdjec(pliki) {
  return pliki.every((plik) => czyPoprawnyPlikZdjecia(plik));
}

function mapujSprzet(sprzet, czyAdmin) {
  const wynik = {
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
    zdjecia_url: formatujZdjeciaUrl(sprzet.zdjecia_url)
  };

  if (Object.prototype.hasOwnProperty.call(sprzet, "specyfikacje")) {
    wynik.specyfikacje = formatujSpecyfikacje(sprzet.specyfikacje);
  }

  return wynik;
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

async function usunZdjeciaZS3(zdjecia_url) {
  const zdjecia = uporzadkujZdjeciaUrl(zdjecia_url);

  for (const url of Object.values(zdjecia)) {
    await usunZdjecieZS3(url);
  }
}

async function dodajSpecyfikacjeSprzetu(client, sprzetId, specyfikacje) {
  for (const [index, specyfikacja] of specyfikacje.entries()) {
    await client.query(
      `
      INSERT INTO specyfikacje_sprzetu (
        sprzet_id,
        nazwa_specyfikacji,
        opis_specyfikacji,
        emotka_specyfikacji,
        kolejnosc
      )
      VALUES ($1, $2, $3, $4, $5);
      `,
      [
        sprzetId,
        specyfikacja.nazwa_specyfikacji,
        specyfikacja.opis_specyfikacji,
        specyfikacja.emotka_specyfikacji,
        index
      ]
    );
  }
}

async function zapiszSpecyfikacjeSprzetu(client, sprzetId, specyfikacje) {
  await client.query(
    `
    DELETE FROM specyfikacje_sprzetu
    WHERE sprzet_id = $1;
    `,
    [sprzetId]
  );

  await dodajSpecyfikacjeSprzetu(client, sprzetId, specyfikacje);
}

async function pobierzSprzetPoId(client, id) {
  const result = await client.query(
    `
    SELECT ${polaSprzetuSql("s")}
    FROM sprzety s
    WHERE s.id = $1;
    `,
    [id]
  );

  return result.rows[0] || null;
}

router.post("/dodaj", upload.fields([
  { name: "zdjecia", maxCount: 10 },
  { name: "zdjecie", maxCount: 1 }
]), async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  const zdjeciaDodaneDoS3 = [];

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
    const pliki = plikiZdjec(req);
    const zdjeciaZBody = parsujZdjeciaUrl(req.body.zdjecia_url);
    const zdjecia_url = zdjeciaZBody.wartosc || {};
    const specyfikacjeZBody = parsujSpecyfikacje(req.body?.specyfikacje ?? req.body?.specyfikacja);

    if (
      !nazwa ||
      nazwa.length > 100 ||
      !kategoria_id ||
      !dozwoloneStatusy.includes(status) ||
      !cena.poprawna ||
      !cenaPoPromocji.poprawna ||
      (cenaPoPromocji.wartosc !== null && cenaPoPromocji.wartosc > cena.wartosc) ||
      !zdjeciaZBody.poprawna ||
      !specyfikacjeZBody.poprawna ||
      !czyPoprawnePlikiZdjec(pliki)
    ) {
      return res.status(400).json({
        error: "Nieprawidlowe dane sprzetu."
      });
    }

    let numerZdjecia = nastepnyNumerZdjecia(zdjecia_url);

    for (const plik of pliki) {
      const klucz = await dodajZdjecieDoS3(plik);
      zdjeciaDodaneDoS3.push(klucz);

      while (zdjecia_url[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjecia_url[String(numerZdjecia)] = klucz;
      numerZdjecia += 1;
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const result = await client.query(
      `
      INSERT INTO sprzety (
        nazwa,
        opis,
        kategoria_id,
        zdjecia_url,
        cena,
        cena_po_promocji,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
      `,
      [nazwa, opis, kategoria_id, zdjecia_url, cena.wartosc, cenaPoPromocji.wartosc, status]
    );

    await dodajSpecyfikacjeSprzetu(client, result.rows[0].id, specyfikacjeZBody.wartosc);

    const sprzet = await pobierzSprzetPoId(client, result.rows[0].id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(201).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    for (const zdjecie of zdjeciaDodaneDoS3) {
      await usunZdjecieZS3(zdjecie).catch(console.error);
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
  } finally {
    if (client) {
      client.release();
    }
  }
});

async function edytujSprzet(req, res) {
  let client = null;
  let transakcjaAktywna = false;

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

    if (czyPolePrzekazane(body, "zdjecie_url") || czyPolePrzekazane(body, "zdjecia_url")) {
      return res.status(400).json({
        error: "Zdjecia sprzetu mozna zmieniac tylko przez add_photos albo delete_photos."
      });
    }

    const pola = [];
    const params = [];
    let cena = null;
    let cenaPoPromocji = null;
    const specyfikacjeZBody = pobierzSpecyfikacjeZBody(body);
    let specyfikacjeDoZapisu = null;

    if (specyfikacjeZBody.przekazane) {
      const specyfikacje = parsujSpecyfikacje(specyfikacjeZBody.wartosc);

      if (!specyfikacje.poprawna) {
        return res.status(400).json({
          error: "Nieprawidlowe specyfikacje sprzetu."
        });
      }

      specyfikacjeDoZapisu = specyfikacje.wartosc;
    }

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

    if (pola.length === 0 && !czyZmianaCeny && specyfikacjeDoZapisu === null) {
      return res.status(400).json({
        error: "Brak danych do aktualizacji."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT cena, cena_po_promocji
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

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

    if (pola.length > 0) {
      params.push(id);

      await client.query(
        `
        UPDATE sprzety
        SET ${pola.join(", ")}
        WHERE id = $${params.length}
        RETURNING id;
        `,
        params
      );
    }

    if (specyfikacjeDoZapisu !== null) {
      await zapiszSpecyfikacjeSprzetu(client, id, specyfikacjeDoZapisu);
    }

    const sprzet = await pobierzSprzetPoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
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

function parsujEdycjeBezZdjec(req, res, next) {
  upload.none()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Zdjecia sprzetu mozna zmieniac tylko przez add_photos albo delete_photos."
      });
    }

    return next();
  });
}

router.patch("/edit/:id", parsujEdycjeBezZdjec, edytujSprzet);
router.put("/edit/:id", parsujEdycjeBezZdjec, edytujSprzet);

router.post("/add_photos/:id", upload.fields([
  { name: "zdjecie", maxCount: 10 },
  { name: "zdjecia", maxCount: 10 }
]), async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  const zdjeciaDodaneDoS3 = [];

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

    const pliki = plikiZdjec(req);
    const zdjeciaZBody = parsujListeUrlZdjec(req.body?.zdjecia_url);

    if (!zdjeciaZBody.poprawna || !czyPoprawnePlikiZdjec(pliki)) {
      return res.status(400).json({
        error: "Nieprawidlowe dane zdjec."
      });
    }

    if (zdjeciaZBody.wartosc.length === 0 && pliki.length === 0) {
      return res.status(400).json({
        error: "Brak zdjec do dodania."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT zdjecia_url
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const zdjecia_url = uporzadkujZdjeciaUrl(obecnyResult.rows[0].zdjecia_url);
    let numerZdjecia = nastepnyNumerZdjecia(zdjecia_url);

    for (const url of zdjeciaZBody.wartosc) {
      while (zdjecia_url[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjecia_url[String(numerZdjecia)] = url;
      numerZdjecia += 1;
    }

    for (const plik of pliki) {
      const klucz = await dodajZdjecieDoS3(plik);
      zdjeciaDodaneDoS3.push(klucz);

      while (zdjecia_url[String(numerZdjecia)]) {
        numerZdjecia += 1;
      }

      zdjecia_url[String(numerZdjecia)] = klucz;
      numerZdjecia += 1;
    }

    await client.query(
      `
      UPDATE sprzety
      SET zdjecia_url = $1
      WHERE id = $2;
      `,
      [uporzadkujZdjeciaUrl(zdjecia_url), id]
    );

    const sprzet = await pobierzSprzetPoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    for (const zdjecie of zdjeciaDodaneDoS3) {
      await usunZdjecieZS3(zdjecie).catch(console.error);
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
});

router.delete("/delete_photos/:id", async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;
  let zdjeciaDoUsuniecia = {};

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

    const numeryZdjec = parsujNumeryZdjec(req.body?.zdjecia ?? req.body?.zdjecia_url);

    if (!numeryZdjec.poprawna) {
      return res.status(400).json({
        error: "Nieprawidlowe numery zdjec."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecnyResult = await client.query(
      `
      SELECT zdjecia_url
      FROM sprzety
      WHERE id = $1
      FOR UPDATE;
      `,
      [id]
    );

    if (obecnyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    const zdjecia_url = uporzadkujZdjeciaUrl(obecnyResult.rows[0].zdjecia_url);

    for (const numer of numeryZdjec.wartosc) {
      if (Object.prototype.hasOwnProperty.call(zdjecia_url, numer)) {
        zdjeciaDoUsuniecia[numer] = zdjecia_url[numer];
        delete zdjecia_url[numer];
      }
    }

    if (Object.keys(zdjeciaDoUsuniecia).length === 0) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono zdjec do usuniecia."
      });
    }

    await client.query(
      `
      UPDATE sprzety
      SET zdjecia_url = $1
      WHERE id = $2;
      `,
      [uporzadkujZdjeciaUrl(zdjecia_url), id]
    );

    const sprzet = await pobierzSprzetPoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    await usunZdjeciaZS3(zdjeciaDoUsuniecia);

    return res.status(200).json(mapujSprzet(sprzet, true));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
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
});

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

    const sprzet = await pobierzSprzetPoId(client, id);

    if (!sprzet) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Nie znaleziono sprzetu."
      });
    }

    await client.query(
      `
      DELETE FROM sprzety
      WHERE id = $1;
      `,
      [id]
    );

    await usunZdjeciaZS3(sprzet.zdjecia_url);
    await client.query("COMMIT");

    return res.status(200).json(mapujSprzet(sprzet, true));
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

router.get("/search", async (req, res) => {
  try {
    const wyszukiwanaNazwa = normalizujTekst(
      req.query.q ?? req.query.search ?? req.query.nazwa
    );

    if (!wyszukiwanaNazwa) {
      return res.status(200).json([]);
    }

    const result = await pool.query(
      `
      SELECT nazwa, zdjecia_url, cena, cena_po_promocji
      FROM sprzety
      WHERE nazwa ILIKE $1
      ORDER BY
        CASE WHEN nazwa ILIKE $2 THEN 0 ELSE 1 END,
        nazwa,
        id
      LIMIT $3;
      `,
      [
        `%${wyszukiwanaNazwa}%`,
        `${wyszukiwanaNazwa}%`,
        limitWynikowWyszukiwania
      ]
    );

    const dane = result.rows.map((sprzet) => ({
      nazwa_przedmiotu: sprzet.nazwa,
      zdjecie_url: pobierzPierwszeZdjecieUrl(sprzet.zdjecia_url),
      cena: Number(sprzet.cena),
      cena_po_promocji: sprzet.cena_po_promocji === null
        ? null
        : Number(sprzet.cena_po_promocji),
      czy_promocja: sprzet.cena_po_promocji !== null &&
        Number(sprzet.cena_po_promocji) < Number(sprzet.cena)
    }));

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
    const nazwa = normalizujTekst(req.query.nazwa);
    const cenaOd = parsujFiltrCeny(req.query.cena_od ?? req.query.cena_min);
    const cenaDo = parsujFiltrCeny(req.query.cena_do ?? req.query.cena_max);
    const tylkoPromocje = parsujBoolean(req.query.promocja ?? req.query.tylko_promocje);

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

    if (nazwa) {
      whereParams.push(`%${nazwa}%`);
      where.push(`nazwa ILIKE $${whereParams.length}`);
    }

    if (cenaOd !== null) {
      whereParams.push(cenaOd);
      where.push(`COALESCE(cena_po_promocji, cena) >= $${whereParams.length}`);
    }

    if (cenaDo !== null) {
      whereParams.push(cenaDo);
      where.push(`COALESCE(cena_po_promocji, cena) <= $${whereParams.length}`);
    }

    if (tylkoPromocje) {
      where.push("cena_po_promocji IS NOT NULL AND cena > cena_po_promocji");
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
    const liczbaStron = Math.ceil(total / limitPrzedmiotowNaStrone);

    const dane = result.rows.map((sprzet) => mapujSprzet(sprzet, czyAdmin));

    return res.status(200).json({
      strona,
      limitPrzedmiotowNaStrone,
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
            SELECT ${polaSprzetuSql("s")}
            FROM sprzety s
            WHERE s.id = $1;
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
