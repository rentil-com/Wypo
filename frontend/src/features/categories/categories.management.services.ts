import { apiDelete, apiFormData, apiGet } from "@/services/api";
import { AddCategoryResponse,DeletableCategoriesResponse,DeleteCategoryResponse , EditCategoryResponse } from "./categories.management.types";

// POST /kategorie/dodaj
export async function dodajKategorie(formData :FormData) {
    const response = await apiFormData("/kategorie/dodaj","POST",formData);

    return response as AddCategoryResponse
}

// PATCH /kategorie/edit/:id
export async function edytujKategorie(id : number, formData : FormData) {
    const response = await apiFormData(`/kategorie/edit/${id}`,"PATCH",formData)

    return response as EditCategoryResponse
}

// PUT /kategorie/edit/:id
export async function nadpiszKategorie(id : number, formData : FormData) {
    const response = await apiFormData(`/kategorie/edit/${id}`,"PUT",formData)
    return response as EditCategoryResponse
}

// DELETE /kategorie/usun/:id
export async function usunKategorie(id : number) {
    const response = await apiDelete(`/kategorie/usun/${id}`)
    return response as DeleteCategoryResponse
}

// GET /kategorie/usun
export async function pobierzUsuwalneKategorie() {
    const response  = await apiGet("/kategorie/usun")
    return response as DeletableCategoriesResponse
}
