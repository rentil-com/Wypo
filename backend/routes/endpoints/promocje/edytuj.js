import { Router } from "express";
import { pool } from "../../../db/pool.js";
import { czyPolePrzekazane, parsujId } from "../../../helpers/common.js";
import {
  BladPromocji,
  mapujPromocje,
  parsujDanePromocji,
  pobierzPromocjePoId,
  walidujIstnienieZakresow,
  walidujSpojnoscPromocji,
  zapiszZakresyPromocji
} from "../../../services/promocje.js";
import { odpowiedzBleduPromocji } from "./common.js";

const router = Router();

function pobierzZakresyZWiersza(wiersz) {
  return {
    zakres_sprzetow: {
      wszystkie: wiersz.obejmuje_wszystkie_sprzety,
      kategorie_ids: (wiersz.kategorie_ids || []).map(Number),
      sprzety_ids: (wiersz.sprzety_ids || []).map(Number)
    },
    zakres_uzytkownikow: {
      wszyscy: wiersz.obejmuje_wszystkich_uzytkownikow,
      uzytkownicy_ids: (wiersz.uzytkownicy_ids || []).map(Number)
    }
  };
}

router.patch("/:id", async (req, res) => {
  let client = null;
  let transakcjaAktywna = false;

  try {
    const id = parsujId(req.params.id);

    if (!id) {
      throw new BladPromocji("Nieprawidlowe ID promocji.");
    }

    const dane = parsujDanePromocji(req.body, { czesciowa: true });

    client = await pool.connect();
    await client.query("BEGIN");
    transakcjaAktywna = true;

    const obecna = await pobierzPromocjePoId(client, id, { blokada: true });

    if (!obecna) {
      await client.query("ROLLBACK");
      transakcjaAktywna = false;

      return res.status(404).json({
        error: "Nie znaleziono promocji."
      });
    }

    const obecneZakresy = pobierzZakresyZWiersza(obecna);
    const wartoscPola = (pole, obecnaWartosc) =>
      czyPolePrzekazane(dane, pole) ? dane[pole] : obecnaWartosc;
    const polaczona = {
      nazwa: wartoscPola("nazwa", obecna.nazwa),
      opis: wartoscPola("opis", obecna.opis),
      typ: wartoscPola("typ", obecna.typ),
      wartosc: wartoscPola("wartosc", Number(obecna.wartosc)),
      aktywna: wartoscPola("aktywna", obecna.aktywna),
      data_od: wartoscPola("data_od", obecna.data_od),
      data_do: wartoscPola("data_do", obecna.data_do),
      zakres_sprzetow: wartoscPola(
        "zakres_sprzetow",
        obecneZakresy.zakres_sprzetow
      ),
      zakres_uzytkownikow: wartoscPola(
        "zakres_uzytkownikow",
        obecneZakresy.zakres_uzytkownikow
      )
    };

    walidujSpojnoscPromocji(polaczona);
    await walidujIstnienieZakresow(
      client,
      polaczona.zakres_sprzetow,
      polaczona.zakres_uzytkownikow
    );

    const pola = [];
    const params = [];
    const dodajPole = (kolumna, wartosc, rzutowanie = "") => {
      params.push(wartosc);
      pola.push(`${kolumna} = $${params.length}${rzutowanie}`);
    };

    for (const pole of [
      "nazwa",
      "opis",
      "wartosc",
      "aktywna",
      "data_od",
      "data_do"
    ]) {
      if (czyPolePrzekazane(dane, pole)) {
        dodajPole(pole, dane[pole]);
      }
    }

    if (czyPolePrzekazane(dane, "typ")) {
      dodajPole("typ", dane.typ, "::typ_promocji");
    }

    if (czyPolePrzekazane(dane, "zakres_sprzetow")) {
      dodajPole(
        "obejmuje_wszystkie_sprzety",
        dane.zakres_sprzetow.wszystkie
      );
    }

    if (czyPolePrzekazane(dane, "zakres_uzytkownikow")) {
      dodajPole(
        "obejmuje_wszystkich_uzytkownikow",
        dane.zakres_uzytkownikow.wszyscy
      );
    }

    if (pola.length > 0) {
      params.push(id);
      await client.query(
        `
        UPDATE promocje
        SET ${pola.join(", ")}
        WHERE id = $${params.length};
        `,
        params
      );
    }

    await zapiszZakresyPromocji(
      client,
      id,
      polaczona.zakres_sprzetow,
      polaczona.zakres_uzytkownikow,
      {
        zastapSprzety: czyPolePrzekazane(dane, "zakres_sprzetow"),
        zastapUzytkownikow: czyPolePrzekazane(
          dane,
          "zakres_uzytkownikow"
        )
      }
    );

    const promocja = await pobierzPromocjePoId(client, id);

    await client.query("COMMIT");
    transakcjaAktywna = false;

    return res.status(200).json(mapujPromocje(promocja));
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
});

export default router;
