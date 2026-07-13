export async function dodajSpecyfikacjeSprzetu(
  client,
  sprzetId,
  specyfikacje
) {
  for (const [index, specyfikacja] of specyfikacje.entries()) {
    await client.query(
      `
      INSERT INTO specyfikacje_sprzetu (
        sprzet_id,
        nazwa_specyfikacji,
        opis_specyfikacji,
        emotka_specyfikacji,
        kolejnosc
      )
      VALUES ($1, $2, $3, $4, $5);
      `,
      [
        sprzetId,
        specyfikacja.nazwa_specyfikacji,
        specyfikacja.opis_specyfikacji,
        specyfikacja.emotka_specyfikacji,
        index
      ]
    );
  }
}

export async function zapiszSpecyfikacjeSprzetu(
  client,
  sprzetId,
  specyfikacje
) {
  await client.query(
    `
    DELETE FROM specyfikacje_sprzetu
    WHERE sprzet_id = $1;
    `,
    [sprzetId]
  );

  await dodajSpecyfikacjeSprzetu(client, sprzetId, specyfikacje);
}
