export function czyZwyklyObiekt(wartosc) {
  return Boolean(wartosc) && typeof wartosc === "object" && !Array.isArray(wartosc);
}

export function normalizujTekst(wartosc) {
  return typeof wartosc === "string" ? wartosc.trim() : "";
}

export function normalizujTekstOpcjonalny(wartosc) {
  const tekst = normalizujTekst(wartosc);
  return tekst || null;
}

export function parsujId(wartosc) {
  const id = Number(wartosc);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function czyPolePrzekazane(body, pole) {
  return Object.prototype.hasOwnProperty.call(body, pole);
}
