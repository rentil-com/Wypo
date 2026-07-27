export type PromotionType = "procentowa" | "kwotowa";

export type PromotionState =
  | "zaplanowana"
  | "aktywna"
  | "wygasla"
  | "wylaczona";

export type PromotionEquipmentScope = {
  wszystkie: boolean;
  kategorie_ids: number[];
  sprzety_ids: number[];
};

export type PromotionUsersScope = {
  wszyscy: boolean;
  uzytkownicy_ids: number[];
};

export type AdminPromotion = {
  id: number;
  nazwa: string;
  opis: string | null;
  typ: PromotionType;
  wartosc: number;
  aktywna: boolean;
  stan: PromotionState;
  data_od: string;
  data_do: string | null;
  utworzona_przez: number;
  data_utworzenia: string;
  zakres_sprzetow: PromotionEquipmentScope;
  zakres_uzytkownikow: PromotionUsersScope;
};

export type PromotionsQueryParams = {
  strona?: number;
  nazwa?: string;
  typ?: PromotionType | "";
  stan?: PromotionState | "";
  sprzet_id?: number | null;
  kategoria_id?: number | null;
  uzytkownik_id?: number | null;
  pokaz_dzienne?: boolean;
};

export type PromotionsResponse = {
  strona: number;
  limitPromocjiNaStrone: number;
  total: number;
  liczbaStron: number;
  dane: AdminPromotion[];
};

export type CreatePromotionBody = {
  nazwa: string;
  opis?: string;
  typ: PromotionType;
  wartosc: number;
  aktywna: boolean;
  data_od: string;
  data_do: string | null;
  zakres_sprzetow: PromotionEquipmentScope;
  zakres_uzytkownikow: PromotionUsersScope;
};

export type UpdatePromotionBody = CreatePromotionBody;

export type PromotionAccount = {
  id: number;
  imie: string | null;
  nazwisko: string | null;
  email: string;
  rola: "admin" | "uzytkownik";
};

export type PromotionAccountsResponse = {
  strona: number;
  total: number;
  liczbaStron: number;
  dane: PromotionAccount[];
};
