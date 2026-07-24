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

export type LoansListParams = {
    strona? : number,
    uzytkownik_id? : number,
    sprzet_id? : number,
    status? : LoanStatus,
    data? : string
}

export type LoansListFilters = {
    uzytkownik_id : number | null,
    sprzet_id : number | null,
    data : string | null,
    status : LoanStatus | null
}

export type LoansListResponse = {
    strona : number,
    limitWnioskowNaStrone : number,
    filtry : LoansListFilters,
    total : number,
    liczbaStron : number,
    dane : LoanResponse[]
}

export type LoanDecision = "zaakceptowany" | "odrzucony"

export type LoanDecisionBody = {
    decyzja : LoanDecision
}

export type LoanPickupReminderBody = {
    miejsce_odbioru? : string,
    godziny_odbioru? : string
}

export type LoanReturnReminderBody = {
    miejsce_zwrotu? : string
}
