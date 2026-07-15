
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