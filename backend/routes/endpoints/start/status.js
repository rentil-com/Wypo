import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { sprawdzPolaczenieZS3 } from "../../../services/s3-images.js";

const router = Router();
const LIMIT_CZASU_USLUGI_MS = 2500;

async function sprawdzBaze() {
  let timeoutId;

  try {
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Przekroczono limit czasu polaczenia z baza"));
      }, LIMIT_CZASU_USLUGI_MS);
    });

    await Promise.race([
      pool.query({
        text: "SELECT 1",
        query_timeout: LIMIT_CZASU_USLUGI_MS
      }),
      timeout
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sprawdzS3() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, LIMIT_CZASU_USLUGI_MS);

  try {
    await sprawdzPolaczenieZS3(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

router.get("/", async (req, res) => {
  const [wynikBazy, wynikS3] = await Promise.allSettled([
    sprawdzBaze(),
    sprawdzS3()
  ]);

  const database = wynikBazy.status === "fulfilled" ? "ok" : "zle";
  const s3 = wynikS3.status === "fulfilled" ? "ok" : "zle";

  if (wynikBazy.status === "rejected") {
    console.error(wynikBazy.reason);
  }

  if (wynikS3.status === "rejected") {
    console.error(wynikS3.reason);
  }

  if (database === "ok" && s3 === "ok") {
    return res.status(200).json({
      api: "ok",
      database,
      s3
    });
  }

  return res.status(503).json({
    api: "ok",
    database,
    s3
  });
});

export default router;
