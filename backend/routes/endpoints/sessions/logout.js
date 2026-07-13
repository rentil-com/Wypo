import { Router } from "express";
import { pool } from "../../../db/pool.js";
import {
  hashujTokenSesji,
  SESSION_COOKIE_NAME,
  wyczyscCookieSesji
} from "../../../services/sessions.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const tokenSesji = req.cookies?.[SESSION_COOKIE_NAME];

    if (tokenSesji) {
      const hashSesji = hashujTokenSesji(tokenSesji);
      await pool.query(
        "DELETE FROM sesje WHERE session_hash = $1",
        [hashSesji]
      );
    }

    wyczyscCookieSesji(res);
    return res.status(200).json({ message: "Wylogowano" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Blad serwera" });
  }
});

export default router;
