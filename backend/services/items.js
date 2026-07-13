import { polaSprzetuSql } from "../helpers/items.js";

export async function pobierzSprzetPoId(client, id) {
  const result = await client.query(
    `
    SELECT ${polaSprzetuSql("s")}
    FROM sprzety s
    WHERE s.id = $1;
    `,
    [id]
  );

  return result.rows[0] || null;
}
