import { apiDelete, apiFormData, apiGet } from "@/services/api";
import { AddCategoryResponse,DeletableCategoriesResponse,DeleteCategoryResponse , EditCategoryResponse } from "./categories.management.types";

export async function dodajKategorie(formData :FormData) {
    const response = await apiFormData("/kategorie/dodaj","POST",formData);

    return response as AddCategoryResponse
}

export async function edytujKategorie(id : number, formData : FormData) {
    const response = await apiFormData(`/kategorie/edit/${id}`,"PATCH",formData)

    return response as EditCategoryResponse
}

export async function nadpiszKategorie(id : number, formData : FormData) {
    const response = await apiFormData(`/kategorie/edit/${id}`,"PUT",formData)
    return response as EditCategoryResponse
}

export async function usunKategorie(id : number) {
    const response = await apiDelete(`/kategorie/usun/${id}`)
    return response as DeleteCategoryResponse
}

export async function pobierzUsuwalneKategorie() {
    const response  = await apiGet("/kategorie/usun")
    return response as DeletableCategoriesResponse
}
