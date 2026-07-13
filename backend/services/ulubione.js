import { pool } from "../db/pool.js";

export async function pobierzIdUlubionych(uzytkownikId) {
  const result = await pool.query(
    `
    SELECT sprzet_id
    FROM ulubione
    WHERE uzytkownik_id = $1
    ORDER BY data_dodania DESC, sprzet_id;
    `,
    [uzytkownikId]
  );

  return result.rows.map((ulubiony) => ulubiony.sprzet_id);
}
