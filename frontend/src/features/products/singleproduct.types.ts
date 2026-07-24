// Specyfikacja pojedynczego produktu
export type ProductSpecification = {
  id: number;
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};

// Szczegoly produktu zwracane przez API
export type SingleProductApiItem = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: string;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  recenzje_srednia : string | null,
  specyfikacje : ProductSpecification[];
};

// Lista szczegolow pojedynczego produktu
export type SingleProductResponse =  SingleProductApiItem[]
