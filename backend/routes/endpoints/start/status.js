import { Router } from "express";
import { pool } from "../../../db/pool.js";

const router = Router();
const LIMIT_CZASU_BAZY_MS = 2500;

router.get("/", async (req, res) => {
  let timeoutId;

  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Przekroczono limit czasu polaczenia z baza"));
      }, LIMIT_CZASU_BAZY_MS);
    });

    await Promise.race([
      pool.query({
        text: "SELECT 1",
        query_timeout: LIMIT_CZASU_BAZY_MS
      }),
      timeout
    ]);

    return res.status(200).json({
      api: "ok",
      database: "ok"
    });
  } catch (err) {
    console.error(err);

    return res.status(503).json({
      api: "ok",
      database: "zle"
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

export default router;
