import { apiGet, buildParamsUrl, buildSearchUrl } from "@/services/api";
import type {
  ItemsQueryParams,
  ItemsResponse,
  ItemsSearchParams,
  ItemsSearchResult,
} from "./products.types";

// GET /items
export async function pobierzProdukty(params: ItemsQueryParams = {}) {
  const url = buildParamsUrl(params);
  const response = await apiGet(url);

  return response as ItemsResponse;
}

// GET /items/search
export async function szukajProdukty(params: ItemsSearchParams) {
  const url = buildSearchUrl(params);
  const response = await apiGet(url);

  return response as ItemsSearchResult[];
}
