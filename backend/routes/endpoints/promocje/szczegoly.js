import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import {
  BladPromocji,
  mapujPromocje,
  pobierzPromocjePoId
} from "../../../services/promocje.js";
import { odpowiedzBleduPromocji } from "./common.js";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const id = parsujId(req.params.id);

    if (!id) {
      throw new BladPromocji("Nieprawidlowe ID promocji.");
    }

    const promocja = await pobierzPromocjePoId(pool, id);

    if (!promocja) {
      return res.status(404).json({
        error: "Nie znaleziono promocji."
      });
    }

    return res.status(200).json(mapujPromocje(promocja));
  } catch (err) {
    return odpowiedzBleduPromocji(err, res);
  }
});

export default router;

