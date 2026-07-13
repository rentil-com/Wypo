import { Router } from "express";
import { pobierzIdUlubionych } from "../../../services/ulubione.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const dane = await pobierzIdUlubionych(req.uzytkownik.id);
    return res.status(200).json(dane);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Blad serwera"
    });
  }
});

export default router;
