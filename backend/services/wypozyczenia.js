import { STATUSY_BLOKUJACE_SPRZET } from "../helpers/wypozyczenia.js";

export async function pobierzWypozyczenieDoAktualizacji(client, id) {
  const result = await client.query(
    `
    SELECT id, sprzet_id, uzytkownik_id, data_zlozenia, data_od, data_do, status, data_zwrotu_rzeczywista
    FROM wypozyczenia
    WHERE id = $1
    FOR UPDATE;
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function pobierzSprzetDoAktualizacji(client, id) {
  const result = await client.query(
    `
    SELECT id, status
    FROM sprzety
    WHERE id = $1
    FOR UPDATE;
    `,
    [id]
  );

  return result.rows[0] || null;
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
