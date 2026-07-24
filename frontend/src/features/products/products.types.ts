// Produkt zwracany na liscie
export type ApiItem = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: string;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  recenzje_srednia : string  | null
};

// Odpowiedz listy produktow
export type ItemsResponse = {
  strona: number;
  total: number;
  liczbaStron: number;
  dane: ApiItem[];
};

// Parametry wyszukiwania produktow
export type ItemsSearchParams = {
  q: string;
};

// Wynik wyszukiwania produktu
export type ItemsSearchResult = {
  id: number;
  nazwa_przedmiotu: string;
  zdjecie_url: string | null;
  cena: number;
  cena_po_promocji: number | null;
  czy_promocja: boolean;
};

// Filtry i paginacja listy produktow
export type ItemsQueryParams = {
  strona?: number;
  kategoria?: number | null;
  nazwa?: string | null;
  status?: string | null;
  cena_od?: number | null;
  cena_do?: number | null;
  cena_min?: number | null;
  cena_max?: number | null;
  promocja?: boolean;
  tylko_promocje?: boolean;
};
