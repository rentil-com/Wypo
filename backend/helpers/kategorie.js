import { formatujUrlZdjecia } from "./images.js";

export function mapujKategorie(kategoria) {
  return {
    ...kategoria,
    zdjecie_url: formatujUrlZdjecia(kategoria.zdjecie_url),
    liczba_sprzetow: Number(kategoria.liczba_sprzetow),
    liczba_dostepnych_sprzetow: Number(
      kategoria.liczba_dostepnych_sprzetow
    )
  };
}
