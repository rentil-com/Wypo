import { apiDelete, apiGet, apiPatch, apiPost,  } from "@/services/api";
import { AddReviewBody, MyReviewsResponse, ProductReviewsResponse,  ReviewResponse,  ReviewsListParams,  ReviewsListResponse,  SingleReviewResponse } from "./reviews.types";

// GET /recenzje/sprzet/:id
export async function pobierzWszystkieRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/sprzet/${id}`)
    return response as ProductReviewsResponse
}

// GET /recenzje/:id
export async function pobierzPojedynczaRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/${id}`)
    return response as SingleReviewResponse    
}

// GET /recenzje/moje
export async function pobierzMojeRecenzje(){
    const response = await apiGet("/recenzje/moje")
    return response as MyReviewsResponse

}

// POST /recenzje/dodaj
export async function dodajRecenzje(body : AddReviewBody) {
    const response = await apiPost("/recenzje/dodaj",body)

    return response as ReviewResponse
}


// GET /recenzje
export async function pobierzRecenzje(params: ReviewsListParams = {},) {
  const query = new URLSearchParams();

  if (params.strona) {
    query.set("strona", params.strona.toString());
  }

  if (params.uzytkownik_id) {
    query.set("uzytkownik_id", params.uzytkownik_id.toString());
  }

  if (params.sprzet_id) {
    query.set("sprzet_id", params.sprzet_id.toString());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.gwiazdki) {
    query.set("gwiazdki", params.gwiazdki.toString());
  }

  const queryString = query.toString();
  const response = await apiGet(
    `/recenzje${queryString ? `?${queryString}` : ""}`,
  );

  return response as ReviewsListResponse;
}

// PATCH /recenzje/ukryj/:id
export async function ukryjRecenzje(id: number) {
    const response = await apiPatch(`/recenzje/ukryj/${id}`, {})
    return response as ReviewResponse
}

// PATCH /recenzje/odkryj/:id
export async function odkryjRecenzje(id: number) {
    const response = await apiPatch(`/recenzje/odkryj/${id}`, {})
    return response as ReviewResponse
}

// DELETE /recenzje/usun/:id
export async function usunRecenzje(id: number) {
    const response = await apiDelete(`/recenzje/usun/${id}`)
    return response as ReviewResponse
}
