import { apiGet, buildParamsUrl, buildSearchUrl } from "./api";
import type {
  ItemsQueryParams,
  ItemsResponse,
  ItemsSearchParams,
  ItemsSearchResult,
} from "@/types/product";

export async function pobierzProdukty(params: ItemsQueryParams = {}) {
  const url = buildParamsUrl(params);
  const response = await apiGet(url);

  return response as ItemsResponse;
}

export async function szukajProdukty(params: ItemsSearchParams) {
  const url = buildSearchUrl(params);
  const response = await apiGet(url);

  return response as ItemsSearchResult[];
}
