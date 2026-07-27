// Kategoria zwracana przez API
export type CategoryApiItem = {
    id : number,
    nazwa : string,
    zdjecie_url : string
    liczba_sprzetow : number,
    liczba_dostepnych_sprzetow : number
}

// Odpowiedz listy kategorii
export type CategoryResponse = CategoryApiItem []
