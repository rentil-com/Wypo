import { apiGet, apiPatch, apiPost } from "@/services/api";
import { pobierzProdukty, type ApiItem } from "@features/products";

import type {
  AdminPromotion,
  CreatePromotionBody,
  PromotionAccount,
  PromotionAccountsResponse,
  PromotionsQueryParams,
  PromotionsResponse,
  UpdatePromotionBody,
} from "./admin-promotions.types";

function buildPromotionsUrl(params: PromotionsQueryParams) {
  const query = new URLSearchParams();

  if (params.strona) {
    query.append("strona", params.strona.toString());
  }

  if (params.nazwa?.trim()) {
    query.append("nazwa", params.nazwa.trim());
  }

  if (params.typ) {
    query.append("typ", params.typ);
  }

  if (params.stan) {
    query.append("stan", params.stan);
  }

  if (params.pokaz_dzienne) {
    query.append("pokaz_dzienne", "true");
  }

  if (params.sprzet_id) {
    query.append("sprzet_id", params.sprzet_id.toString());
  }

  if (params.kategoria_id) {
    query.append("kategoria_id", params.kategoria_id.toString());
  }

  if (params.uzytkownik_id) {
    query.append("uzytkownik_id", params.uzytkownik_id.toString());
  }

  const queryString = query.toString();

  return queryString ? `/promocje?${queryString}` : "/promocje";
}

export async function pobierzPromocje(
  params: PromotionsQueryParams = {},
): Promise<PromotionsResponse> {
  const response = await apiGet(buildPromotionsUrl(params));

  return response as PromotionsResponse;
}

export async function dodajPromocje(
  body: CreatePromotionBody,
): Promise<AdminPromotion> {
  const response = await apiPost("/promocje", body);

  return response as AdminPromotion;
}

export async function edytujPromocje(
  id: number,
  body: UpdatePromotionBody,
): Promise<AdminPromotion> {
  const response = await apiPatch(`/promocje/${id}`, body);

  return response as AdminPromotion;
}

export async function ustawAktywnoscPromocji(
  id: number,
  aktywna: boolean,
): Promise<AdminPromotion> {
  const response = await apiPatch(`/promocje/${id}`, { aktywna });

  return response as AdminPromotion;
}

export async function wygasPromocje(
  id: number,
): Promise<AdminPromotion> {
  const response = await apiPatch(`/promocje/${id}`, {
    data_do: new Date().toISOString(),
  });

  return response as AdminPromotion;
}

export async function pobierzWszystkieProduktyPromocji(): Promise<ApiItem[]> {
  const produkty: ApiItem[] = [];
  let strona = 1;
  let liczbaStron = 1;

  do {
    const response = await pobierzProdukty({ strona });

    produkty.push(...response.dane);
    liczbaStron = response.liczbaStron;
    strona += 1;
  } while (strona <= liczbaStron);

  return produkty;
}

export async function pobierzWszystkichUzytkownikowPromocji():
Promise<PromotionAccount[]> {
  const uzytkownicy: PromotionAccount[] = [];
  let strona = 1;
  let liczbaStron = 1;

  do {
    const response = await apiGet(
      `/account/details/all?strona=${strona}`,
    ) as PromotionAccountsResponse;

    uzytkownicy.push(...response.dane);
    liczbaStron = response.liczbaStron;
    strona += 1;
  } while (strona <= liczbaStron);

  return uzytkownicy;
}
