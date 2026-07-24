import { apiGet } from "@/services/api";
import type { CategoryApiItem, CategoryResponse } from "./categories.types";
export async function pobierzKategorie() {
    const response = await apiGet("/kategorie");

    return response as CategoryResponse
}

export async function pobierzKategoriePoId(id: number) {
  const response = await apiGet(`/kategorie/${id}`);

  return response as CategoryApiItem;
}
