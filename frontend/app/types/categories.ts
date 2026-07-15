export type CategoryApiItem = {
    id : number,
    nazwa : string,
    zdjecie_url : string
    liczba_sprzetow : number,
    liczba_dostepnych_sprzetow : number
}

export type CategoryResponse = CategoryApiItem []
