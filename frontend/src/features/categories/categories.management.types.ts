// Odpowiedz dodania kategorii
export type AddCategoryResponse = {
    id : number,
    nazwa : string,
    zdjecie_url : string | null,
}

// Odpowiedz edycji kategorii
export type EditCategoryResponse = {
    id : number,
    nazwa : string, 
    zdjecie_url : string | null,
}


// Odpowiedz usuniecia kategorii
export type DeleteCategoryResponse = {
    id : number,
    nazwa : string, 
    zdjecie_url : string | null,
}

// ID kategorii, ktore mozna usunac
export type DeletableCategoriesResponse = number[]
