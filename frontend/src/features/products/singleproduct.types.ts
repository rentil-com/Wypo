
export type SingleProductApiItem = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: string;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje : Array<Record<string, string>>
};

export type SingleProductResponse =  SingleProductApiItem[]
