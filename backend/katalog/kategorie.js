import { pool } from '../db/pool.js';
import { Router } from 'express';
import { pobierzUzytkownikaZSesji } from "../auth/sessions.js";
import 'dotenv/config';

const router = Router();

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

function mapujKategorie(kategoria) {
    return {
        ...kategoria,
        liczba_sprzetow: Number(kategoria.liczba_sprzetow),
        liczba_dostepnych_sprzetow: Number(kategoria.liczba_dostepnych_sprzetow)
    };
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
