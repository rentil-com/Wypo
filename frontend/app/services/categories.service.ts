import { apiGet } from "./api";
import type { CategoryApiItem, CategoryResponse } from "@/types/categories";
export async function pobierzKategorie() {
    const response = await apiGet("/kategorie");

    return response as CategoryResponse
}

export async function pobierzKategoriePoId(id: number) {
  const response = await apiGet(`/kategorie/${id}`);

  return response as CategoryApiItem;
}