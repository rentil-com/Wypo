import { apiDelete, apiGet, apiPost } from "@/services/api";
import { AddToFavouriteResponse, FavouritesResponse, RemoveFromFavouriteResponse } from "./fav.types";
export async function polubPrzedmiot(id : number) {
    const response = await apiPost(`/ulubione/polub/${id}`)
    return response as AddToFavouriteResponse
}

export async function usunPolubienie(id:  number) {
    const response = await apiDelete(`/ulubione/odlub/${id}`)
    return response as RemoveFromFavouriteResponse
}


export async function pobierzUlubione() {
    const response  = await apiGet("/ulubione")

    return response as FavouritesResponse
}