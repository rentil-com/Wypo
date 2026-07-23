export type ReviewsStatus = "aktywna" |
"ukryta" | "usunieta"

export type  Review_Rating = 1 | 2 | 3 | 4 | 5

export type ReviewResponse=  {
    id : number,
    uzytkownik_id : number,
    sprzet_id : number,
    wypozyczenie_id : number | null,
    gwiazdki : Review_Rating
    tresc : string | null,
    status : ReviewsStatus,
    data_dodania : string,
    imie? : string,
    nazwisko? : string,
    nazwa_sprzetu? : string
}

export type ProductReviewsResponse = {
  strona: number;
  limitRecenzjiNaStrone: number;
  sprzet_id: number;
  srednia_ocen: number;
  liczba_recenzji: number;
  total: number;
  liczbaStron: number;
  dane: ReviewResponse[];
};


export type SingleReviewResponse = {
    id : number,
    uzytkownik_id : number,
    sprzet_id : number,
    wypozyczenie_id : number | null,
    gwiazdki : Review_Rating
    tresc : string | null,
    status : ReviewsStatus,
    data_dodania : string,
    imie? : string,
    nazwisko? : string,
    nazwa_sprzetu? : string

}


export type MyReviewsResponse = {
    strona: number;
    limitRecenzjiNaStrone: number;
    total: number;
    liczbaStron: number;
    dane: ReviewResponse[];
}

export type AddReviewBody = {
  sprzet_id: number;
  wypozyczenie_id?: number | null;
  gwiazdki: Review_Rating;
  tresc?: string | null;
};
