<<<<<<< HEAD
import { apiGet } from "./api";
import type { ItemsResponse } from "@/types/product";
export async function pobierzProdukty() {
    const response = await apiGet("/items");

    return response as ItemsResponse
}
=======
import { apiGet, buildParamsUrl, buildSearchUrl } from "./api";
import type { ItemsQueryParams, ItemsResponse, ItemsSearchResult } from "@/types/product";
import { ItemsSearchParams } from "@/types/product";
export async function pobierzProdukty(params : ItemsQueryParams = {}) {
    const url = buildParamsUrl(params)
    const response = await apiGet(url);

    return response as ItemsResponse
}

export async function szukajProdukty( params : ItemsSearchParams) {
   const url = buildSearchUrl(params);
   const response = await apiGet(url)
   
   return response as  ItemsSearchResult[]
}

>>>>>>> feature/frontend-items
