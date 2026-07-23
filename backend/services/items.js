import { pobierzSprzetZPromocja } from "./promocje.js";

export async function pobierzSprzetPoId(client, id, uzytkownikId = null) {
  return pobierzSprzetZPromocja(client, id, uzytkownikId, {
    zeSpecyfikacjami: true
  });
}
