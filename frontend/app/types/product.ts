
export type ApiItem = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: string;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
};

export type ItemsResponse = {
  strona: number;
  total: number;
  liczbaStron: number;
  dane: ApiItem[];
};

export type ItemsSearchParams = {
  q: string;
};

export type ItemsSearchResult = {
  id: number;
  nazwa_przedmiotu: string;
  zdjecie_url: string | null;
  cena: number;
  cena_po_promocji: number | null;
  czy_promocja: boolean;
};


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
