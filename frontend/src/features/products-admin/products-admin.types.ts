export type ProductStatus = "dostepny" | "wypozyczony" | "w_naprawie";

export type ProductSpecification = {
  id: number;
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};

export type ProductSpecificationBody = {
  nazwa_specyfikacji: string;
  opis_specyfikacji: string;
  emotka_specyfikacji: string | null;
};

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

export type PatchProductBody = {
  nazwa?: string;
  opis?: string | null;
  kategoria_id?: number;
  status?: ProductStatus;
  cena?: string | number;
  cena_po_promocji?: string | number | null;
  specyfikacje?: ProductSpecificationBody[];
};

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

export type PutProductBody = {
  nazwa?: string;
  opis?: string | null;
  kategoria_id?: number;
  status?: ProductStatus;
  cena?: string | number;
  cena_po_promocji?: string | number | null;
  specyfikacje?: ProductSpecificationBody[];
};

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

export type AddProductPhotosBody = {
  zdjecia_url: string[];
};

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

export type DeleteProductPhotosBody =
  | {
      zdjecia: number[];
      zdjecia_url?: never;
    }
  | {
      zdjecia?: never;
      zdjecia_url: Record<string, string>;
    };

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

export type GetDeletableProductsResponse = number[];
