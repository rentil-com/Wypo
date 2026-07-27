// Status produktu
export type ProductStatus = "dostepny" | "wypozyczony" | "w_naprawie";

// Specyfikacja zwracana przez API
export type ProductSpecification = {
  id: number;
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};

// Specyfikacja wysylana do API
export type ProductSpecificationBody = {
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};

// Body dodania produktu
export type AddProductBody = {
  nazwa: string;
  opis?: string | null;
  kategoria_id: number;
  zdjecia_url?: Record<string, string>;
  specyfikacje?: ProductSpecificationBody[];
  cena: string | number;
  cena_po_promocji?: string | number | null;
  status?: ProductStatus;
};

// Odpowiedz dodania produktu
export type AddProductResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// Body czesciowej edycji produktu
export type PatchProductBody = {
  nazwa?: string;
  opis?: string | null;
  kategoria_id?: number;
  status?: ProductStatus;
  cena?: string | number;
  cena_po_promocji?: string | number | null;
  specyfikacje?: ProductSpecificationBody[];
};

// Odpowiedz czesciowej edycji produktu
export type PatchProductResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// Body nadpisania produktu
export type PutProductBody = {
  nazwa?: string;
  opis?: string | null;
  kategoria_id?: number;
  status?: ProductStatus;
  cena?: string | number;
  cena_po_promocji?: string | number | null;
  specyfikacje?: ProductSpecificationBody[];
};

// Odpowiedz nadpisania produktu
export type PutProductResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// Body dodania zdjec produktu
export type AddProductPhotosBody = {
  zdjecia_url: string[];
};

// Odpowiedz dodania zdjec produktu
export type AddProductPhotosResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// Odpowiedz usuniecia produktu
export type DeleteProductResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// Body usuniecia wybranych zdjec
export type DeleteProductPhotosBody =
  | {
      zdjecia: number[];
      zdjecia_url?: never;
    }
  | {
      zdjecia?: never;
      zdjecia_url: Record<string, string>;
    };

// Odpowiedz usuniecia zdjec produktu
export type DeleteProductPhotosResponse = {
  id: number;
  nazwa: string;
  opis: string | null;
  kategoria_id: number;
  status: ProductStatus;
  zdjecia_url: Record<string, string>;
  cena: number;
  cena_po_promocji: number | null;
  specyfikacje: ProductSpecification[];
};

// ID produktow, ktore mozna usunac
export type GetDeletableProductsResponse = number[];
