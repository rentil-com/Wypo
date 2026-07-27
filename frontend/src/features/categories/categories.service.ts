import { apiGet } from "@/services/api";
import type { CategoryApiItem, CategoryResponse } from "./categories.types";

// GET /kategorie
export async function pobierzKategorie() {
    const response = await apiGet("/kategorie");

    return response as CategoryResponse
}

// GET /kategorie/:id
export async function pobierzKategoriePoId(id: number) {
  const response = await apiGet(`/kategorie/${id}`);

  return response as CategoryApiItem;
}
