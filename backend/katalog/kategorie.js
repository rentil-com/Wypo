import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import crypto from "crypto";
import 'dotenv/config';

const router = Router();
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
const s3Folder = process.env.S3_CATEGORIES_IMAGES || "categories/images/";
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

function mapujKategorie(kategoria) {
    return {
        ...kategoria,
        zdjecie_url: formatujUrlZdjecia(kategoria.zdjecie_url),
        liczba_sprzetow: Number(kategoria.liczba_sprzetow),
        liczba_dostepnych_sprzetow: Number(kategoria.liczba_dostepnych_sprzetow)
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

router.post("/dodaj", async (req, res) => {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
        return res.status(403).json({
            error: "Brak uprawnien."
        });
    }

    const nazwa = normalizujTekst(req.body.nazwa);
    const zdjecie = parsujUrlZdjecia(req.body.zdjecie_url);

    if (!nazwa || nazwa.length > 100 || !zdjecie.poprawna) {
        return res.status(400).json({
            error: "Nieprawidlowe dane kategorii."
        });
    }

    const result = await pool.query(
        `
        INSERT INTO kategorie (nazwa, zdjecie_url)
        VALUES ($1, $2)
        RETURNING id, nazwa, zdjecie_url;
        `,
        [nazwa, zdjecie.wartosc]
    );

    return res.status(201).json(result.rows[0]);
});

async function edytujKategorie(req, res) {
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
                error: "Nieprawidlowe ID kategorii."
            });
        }

        const body = req.body || {};
        const pola = [];
        const params = [];
        let nowyKluczZdjecia = null;

        if (czyPolePrzekazane(body, "nazwa")) {
            const nazwa = normalizujTekst(body.nazwa);

            if (!nazwa || nazwa.length > 100) {
                return res.status(400).json({
                    error: "Nieprawidlowa nazwa kategorii."
                });
            }

            params.push(nazwa);
            pola.push(`nazwa = $${params.length}`);
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
            const zdjecie = parsujUrlZdjecia(body.zdjecie_url);

            if (!zdjecie.poprawna) {
                return res.status(400).json({
                    error: "Nieprawidlowy URL zdjecia."
                });
            }

            params.push(zdjecie.wartosc);
            pola.push(`zdjecie_url = $${params.length}`);
            nowyKluczZdjecia = pobierzKluczS3(zdjecie.wartosc);
        }

        if (pola.length === 0) {
            return res.status(400).json({
                error: "Brak danych do aktualizacji."
            });
        }

        client = await pool.connect();
        await client.query("BEGIN");
        transakcjaAktywna = true;

        const obecnyResult = await client.query(
            `
            SELECT zdjecie_url
            FROM kategorie
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
                error: "Nie znaleziono kategorii."
            });
        }

        if (req.file || czyPolePrzekazane(body, "zdjecie_url")) {
            const poprzedniKluczZdjecia = pobierzKluczS3(obecnyResult.rows[0].zdjecie_url);

            if (poprzedniKluczZdjecia && poprzedniKluczZdjecia !== nowyKluczZdjecia) {
                poprzednieZdjecieDoUsuniecia = obecnyResult.rows[0].zdjecie_url;
            }
        }

        params.push(id);

        const result = await client.query(
            `
            UPDATE kategorie
            SET ${pola.join(", ")}
            WHERE id = $${params.length}
            RETURNING id, nazwa, zdjecie_url;
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

        return res.status(200).json({
            ...result.rows[0],
            zdjecie_url: formatujUrlZdjecia(result.rows[0].zdjecie_url)
        });
    } catch (err) {
        if (transakcjaAktywna && client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        if (!transakcjaZatwierdzona && zdjecieDodaneDoS3) {
            await usunZdjecieZS3(zdjecieDodaneDoS3).catch(console.error);
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

router.patch("/edit/:id", upload.single("zdjecie"), edytujKategorie);
router.put("/edit/:id", upload.single("zdjecie"), edytujKategorie);

router.delete("/usun/:id", async (req, res) => {
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
                error: "Nieprawidlowe ID kategorii."
            });
        }

        const result = await pool.query(
            `
            DELETE FROM kategorie
            WHERE id = $1
            RETURNING id, nazwa, zdjecie_url;
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Nie znaleziono kategorii."
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === "23503") {
            return res.status(409).json({
                error: "Nie mozna usunac kategorii, do ktorej przypisany jest sprzet."
            });
        }

        console.error(err);

        return res.status(500).json({
            error: "Blad serwera"
        });
    }
});

router.get("/usun", async (req, res) => {
    const uzytkownik = await pobierzUzytkownikaZSesji(req);

    if (uzytkownik?.rola !== "admin") {
        return res.status(403).json({
            error: "Brak uprawnien."
        });
    }

    const result = await pool.query(
        `
        SELECT id
        FROM kategorie k
        WHERE NOT EXISTS (
            SELECT 1
            FROM sprzety s
            WHERE s.kategoria_id = k.id
        )
        ORDER BY id;
        `
    );

    const dane = result.rows.map((kategoria) => kategoria.id);

    return res.status(200).json(dane);
});

router.get("/", async (req, res) => {
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
        GROUP BY k.id, k.nazwa, k.zdjecie_url
        ORDER BY k.id;
        `
    );

    const dane = result.rows.map(mapujKategorie);

    return res.status(200).json(dane);
});

router.get("/:id", async (req, res) => {
    const id = parsujId(req.params.id);

    if (!id) {
        return res.status(400).json({
            error: "Nieprawidłowe ID kategorii."
        });
    }

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
        WHERE k.id = $1
        GROUP BY k.id, k.nazwa, k.zdjecie_url;
        `,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: "Nie znaleziono kategorii."
        });
    }

    const kategoria = result.rows[0];

    return res.status(200).json(mapujKategorie(kategoria));
});

export default router;
