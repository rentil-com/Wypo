
import express from 'express';
import 'dotenv/config';
const app = express();
const port = 3000;
import authSession from './auth/sessions.js'
import items from './katalog/items.js'
import kategorie from './katalog/kategorie.js'
import { pool } from './db/pool.js';
import cookieParser from 'cookie-parser';

app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT id, nazwa, zdjecie_url
            FROM kategorie
            ORDER BY id;
            `
        )

        return res.status(200).json(result.rows)
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: "Blad serwera"
        });
    }
})

app.use("/auth", authSession)
app.use("/items", items)
app.use("/kategorie", kategorie)

app.listen(port, async () => {
    console.log(`Przykładowa apka na porcie ${port}`)
})
