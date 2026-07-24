export type ProductSpecification = {
  id: number;
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};
export type ProductPromotion = {
  id: number;
  nazwa: string;
  typ: "procentowa" | "kwotowa";
  wartosc: number;
  data_do: string | null;
};

export type SingleProductApiItem = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: string;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_aktualna: number;
  cena_po_promocji: number | null;
  czy_promocja: boolean;
  promocja: ProductPromotion | null;
  recenzje_srednia : string | null,
  specyfikacje : ProductSpecification[];
};

export type SingleProductResponse =  SingleProductApiItem[]
