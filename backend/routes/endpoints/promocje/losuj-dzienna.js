import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { parsujId } from "../../../helpers/common.js";
import { tylkoAdmin } from "../../../middleware/session.js";
import {
  BladPromocji,
  mapujPromocje
} from "../../../services/promocje.js";
import { utworzDziennaPromocje } from "../../../services/dzienne-promocje.js";
import { odpowiedzBleduPromocji } from "./common.js";

const router = Router();

function przygotujOdpowiedz(wynik) {
  const promocja = mapujPromocje(wynik.promocja);

  return {
    promocja,
    ponowne_losowanie_od: promocja.data_do,
    zastapiona_promocja_id: wynik.zastapionaPromocjaId
  };
}

async function obsluzLosowanie(
  req,
  res,
  { uzytkownikId, wymusReset = false }
) {
  let client = null;
  let transakcjaAktywna = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const wynik = await utworzDziennaPromocje(client, {
      uzytkownikId,
      utworzonaPrzezId: req.uzytkownik.id,
      wymusReset
    });

    await client.query("COMMIT");
    transakcjaAktywna = false;

    if (!wynik.utworzona) {
      const odpowiedz = przygotujOdpowiedz(wynik);

      return res.status(409).json({
        error: "Dzienna promocja jest nadal aktywna.",
        promocja: odpowiedz.promocja,
        ponowne_losowanie_od: odpowiedz.ponowne_losowanie_od
      });
    }

    return res.status(201).json(przygotujOdpowiedz(wynik));
  } catch (err) {
    if (transakcjaAktywna && client) {
      await client.query("ROLLBACK").catch(console.error);
    }

    return odpowiedzBleduPromocji(err, res);
  } finally {
    if (client) {
      client.release();
    }
  }
}

router.post("/losuj-dzienna-promocje", async (req, res) => {
  return obsluzLosowanie(req, res, {
    uzytkownikId: req.uzytkownik.id
  });
});

router.post(
  "/losuj-dzienna-promocja/:id",
  tylkoAdmin,
  async (req, res) => {
    const uzytkownikId = parsujId(req.params.id);

    if (!uzytkownikId) {
      return odpowiedzBleduPromocji(
        new BladPromocji("Nieprawidlowe ID uzytkownika."),
        res
      );
    }

    return obsluzLosowanie(req, res, {
      uzytkownikId,
      wymusReset: true
    });
  }
);

export default router;
