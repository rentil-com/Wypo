export function pobierzDodatniaLiczbeCalkowitaEnv(nazwa, domyslnie) {
  const wartosc = process.env[nazwa];

  if (wartosc === undefined || String(wartosc).trim() === "") {
    return domyslnie;
  }

  const liczba = Number(wartosc);

  if (!Number.isInteger(liczba) || liczba <= 0) {
    throw new Error(`${nazwa} musi byc dodatnia liczba calkowita.`);
  }

  return liczba;
}

export function pobierzListeEnv(nazwa, domyslnie) {
  const wartosc = process.env[nazwa];

  if (wartosc === undefined || String(wartosc).trim() === "") {
    return domyslnie;
  }

  const lista = String(wartosc)
    .split(",")
    .map((element) => element.trim())
    .filter(Boolean);

  if (lista.length === 0) {
    throw new Error(`${nazwa} musi zawierac co najmniej jedna wartosc.`);
  }

  return lista;
}
