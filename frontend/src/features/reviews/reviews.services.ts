import { apiDelete, apiGet, apiPost,  } from "@/services/api";
import { AddReviewBody, MyReviewsResponse, ProductReviewsResponse,  ReviewResponse,  SingleReviewResponse } from "./reviews.types";

{/*USER ONLY */}
export async function pobierzWszystkieRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/sprzet/${id}`)
    return response as ProductReviewsResponse
}

export async function pobierzPojedynczaRecenzjeProduktu(id : number) {
    const response = await apiGet(`/recenzje/${id}`)
    return response as SingleReviewResponse    
}

export async function pobierzMojeRecenzje(){
    const response = await apiGet("/recenzje/moje")
    return response as MyReviewsResponse

}

export async function dodajRecenzje(body : AddReviewBody) {
    const response = await apiPost("/recenzje/dodaj",body)

    return response as ReviewResponse
}