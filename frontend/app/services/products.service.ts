import { apiGet } from "./api";
import type { ItemsResponse } from "@/types/product";
export async function pobierzProdukty() {
    const response = await apiGet("/items");

    return response as ItemsResponse
}