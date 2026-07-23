import { apiDelete, apiGet,  } from "@/services/api";
import { ProductReviewsResponse,  SingleReviewResponse } from "./reviews.types";

export async function pobierzWszystkieRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/sprzet/${id}`)
    return response as ProductReviewsResponse
}

export async function pobierzPojedynczaRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/${id}`)
    return response as SingleReviewResponse    
}
