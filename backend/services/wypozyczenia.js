import {
  polaWypozyczeniaSql,
  STATUSY_BLOKUJACE_SPRZET
} from "../helpers/wypozyczenia.js";
import { pobierzSprzetZPromocja } from "./promocje.js";

export async function pobierzWypozyczenieDoAktualizacji(client, id) {
  const result = await client.query(
    `
    SELECT ${polaWypozyczeniaSql("w")}
    FROM wypozyczenia w
    WHERE w.id = $1
    FOR UPDATE OF w;
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function pobierzSprzetDoAktualizacji(
  client,
  id,
  uzytkownikId = null
) {
  return pobierzSprzetZPromocja(client, id, uzytkownikId, {
    blokada: true
  });
}

export async function czySprzetMaAktywneWypozyczenia(
  client,
  sprzetId,
  pominWypozyczenieId = null
) {
  const params = [sprzetId, STATUSY_BLOKUJACE_SPRZET];
  let dodatkowyWarunek = "";

  if (pominWypozyczenieId) {
    params.push(pominWypozyczenieId);
    dodatkowyWarunek = `AND id <> $${params.length}`;
  }

  const result = await client.query(
    `
    SELECT 1
    FROM wypozyczenia
    WHERE sprzet_id = $1
      AND status = ANY($2::status_wypozyczenia[])
      ${dodatkowyWarunek}
    LIMIT 1;
    `,
    params
  );

  return result.rows.length > 0;
}

export async function pobierzAktywneKonfliktujaceWypozyczenie(
  client,
  wypozyczenie
) {
  const result = await client.query(
    `
    SELECT id
    FROM wypozyczenia
    WHERE sprzet_id = $1
      AND id <> $2
      AND status = 'aktywny'
      AND data_od <= $4
      AND data_do >= $3
    LIMIT 1
    FOR UPDATE;
    `,
    [
      wypozyczenie.sprzet_id,
      wypozyczenie.id,
      wypozyczenie.data_od,
      wypozyczenie.data_do
    ]
  );

  return result.rows[0] || null;
}

export async function odrzucKonfliktujaceWnioski(client, wypozyczenie) {
  const result = await client.query(
    `
    UPDATE wypozyczenia
    SET status = 'odrzucony'
    WHERE sprzet_id = $1
      AND id <> $2
      AND status IN ('oczekujacy', 'zaakceptowany')
      AND data_od <= $4
      AND data_do >= $3
    RETURNING id;
    `,
    [
      wypozyczenie.sprzet_id,
      wypozyczenie.id,
      wypozyczenie.data_od,
      wypozyczenie.data_do
    ]
  );

  return result.rows.map((wiersz) => wiersz.id);
}

export async function odswiezStatusSprzetu(
  client,
  sprzetId,
  zachowajNaprawe = true
) {
  const maAktywne = await czySprzetMaAktywneWypozyczenia(client, sprzetId);
  const status = maAktywne ? "wypozyczony" : "dostepny";

  if (!zachowajNaprawe) {
    await client.query(
      `
      UPDATE sprzety
      SET status = $1
      WHERE id = $2;
      `,
      [status, sprzetId]
    );

    return;
  }

  await client.query(
    `
    UPDATE sprzety
    SET status = $1
    WHERE id = $2
      AND status <> 'w_naprawie';
    `,
    [status, sprzetId]
  );
}
