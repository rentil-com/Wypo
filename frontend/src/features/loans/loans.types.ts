// Status wypozyczenia
export type LoanStatus = "oczekujacy" | "zaakceptowany" | "odrzucony" | "aktywny" | "zwrocony"

// Promocja zapisana przy wypozyczeniu
export type Promocja = {
  id: number | null;
  nazwa: string;
  typ: "procentowa" | "kwotowa";
  wartosc: number;
}

// Body wniosku o wypozyczenie
export type LoanBody = {
    sprzet_id : number,
    data_od : string,
    data_do : string
}

// Wypozyczenie zwracane przez API
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

// Parametry listy wypozyczen
export type LoansListParams = {
    strona? : number,
    uzytkownik_id? : number,
    sprzet_id? : number,
    status? : LoanStatus,
    data? : string
}

// Filtry zwracane z lista wypozyczen
export type LoansListFilters = {
    uzytkownik_id : number | null,
    sprzet_id : number | null,
    data : string | null,
    status : LoanStatus | null
}

// Odpowiedz listy wypozyczen
export type LoansListResponse = {
    strona : number,
    limitWnioskowNaStrone : number,
    filtry : LoansListFilters,
    total : number,
    liczbaStron : number,
    dane : LoanResponse[]
}

// Decyzje dostepne dla wniosku
export type LoanDecision = "zaakceptowany" | "odrzucony"

// Body rozpatrzenia wniosku
export type LoanDecisionBody = {
    decyzja : LoanDecision
}

// Body przypomnienia o odbiorze
export type LoanPickupReminderBody = {
    miejsce_odbioru? : string,
    godziny_odbioru? : string
}

// Body przypomnienia o zwrocie
export type LoanReturnReminderBody = {
    miejsce_zwrotu? : string
}

// Dane wyslanego maila
export type LoanReminderMail = {
    messageId : string,
    odbiorcy : string[]
}

// Odpowiedz wyslania przypomnienia
export type LoanReminderResponse = {
    message : string,
    mail : LoanReminderMail,
    wypozyczenie : LoanResponse
}

// Body informacji o przeterminowanym zwrocie
export type LoanOverdueReminderBody = {
    kontakt? : string
}

// Body czesciowej edycji wypozyczenia
export type LoanPatchBody = {
    data_od? : string,
    data_do? : string,
    status? : LoanStatus,
    data_zwrotu_rzeczywista? : string | null
}

// Body nadpisania wypozyczenia
export type LoanPutBody = {
    data_od? : string,
    data_do? : string,
    status? : LoanStatus,
    data_zwrotu_rzeczywista? : string | null
}

export type MyLoansParams = {
  strona?: number;
};

export type MyLoansResponse = {
  strona: number;
  limitWnioskowNaStrone: number;
  total: number;
  liczbaStron: number;
  dane: LoanResponse[];
};