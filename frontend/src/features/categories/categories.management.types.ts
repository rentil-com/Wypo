export type AddCategoryResponse = {
    id : number,
    nazwa : string,
    zdjecie_url : string | null,
}

export type EditCategoryResponse = {
    id : number,
    nazwa : string, 
    zdjecie_url : string | null,
}


export type DeleteCategoryResponse = {
    id : number,
    nazwa : string, 
    zdjecie_url : string | null,
}

export type DeletableCategoriesResponse = number[]