export type DailyPromotion = {
  id: number;
  nazwa?: string;
  opis?: string | null;
  typ: "procentowa";
  wartosc: number;
  aktywna?: boolean;
  stan?: "zaplanowana" | "aktywna" | "wygasla" | "wylaczona";
  data_od: string;
  data_do: string;
  zakres_sprzetow: {
    wszystkie: boolean;
    kategorie_ids: number[];
    sprzety_ids: number[];
  };
};

export type DailyPromotionResponse = {
  promocja: DailyPromotion;
  ponowne_losowanie_od: string;
  zastapiona_promocja_id?: number | null;
};

export type DailyPromotionResult = DailyPromotionResponse & {
  utworzona: boolean;
};
