import { apiGet, buildSearchUrl } from "./api";
import type { ItemsResponse, ItemsSearchResult } from "@/types/product";
import { ItemsSearchParams } from "@/types/product";
export async function pobierzProdukty() {
    const response = await apiGet("/items");

    return response as ItemsResponse
}

export async function szukajProdukty( params : ItemsSearchParams) {
   const url = buildSearchUrl(params);
   const response = await apiGet(url)
   
   return response as  ItemsSearchResult[]
}