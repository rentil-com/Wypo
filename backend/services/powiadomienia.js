import { wyslijMail } from "../mail/wysylkaMaili.js";

export function wyslijPowiadomienieWTle(email, format, opis) {
  wyslijMail({ do: email, ...format }).catch((err) => {
    console.error(`Nie udalo sie wyslac maila (${opis}):`, err);
  });
}
