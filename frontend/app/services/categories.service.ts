import { apiGet } from "./api";
import type { CategoryApiItem, CategoryResponse } from "@/types/categories";
export async function pobierzKategorie() {
    const response = await apiGet("/kategorie");

    return response as CategoryResponse
}