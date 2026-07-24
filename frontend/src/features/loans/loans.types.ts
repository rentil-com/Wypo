export type LoanStatus = "oczekujacy" | "zaakceptowany" | "odrzucony" | "aktywny" | "zwrocony"

export type Promocja = {
  id: number | null;
  nazwa: string;
  typ: "procentowa" | "kwotowa";
  wartosc: number;
}

export type LoanBody = {
    sprzet_id : number,
    data_od : string,
    data_do : string
}


export type LoanResponse = {
    id : number,
    sprzet_id : number,
    uzytkownik_id : number,
    data_zlozenia : string,
    data_od : string,
    data_do : string,
    status : LoanStatus,
    data_zwrotu_rzeczywista :string | null,
    cena_bazowa : number,
    cena_koncowa : number,
    promocja_id : number | null,
    promocja : Promocja  | null
}