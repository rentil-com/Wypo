import { ItemsSearchParams } from "@/types/product";

const API_URL = process.env.EXPO_PUBLIC_API_URL

export async function apiGet(path : string) {
    if(!API_URL){
        throw new Error("Brak adresu API")
    }


    const response = await fetch(`${API_URL}${path}`)
    
    const data = await response.json()


    if(!response.ok){
        throw new Error(
            data.error || "Nie udało sie pobrac danych"  
        );
    }

    return data
}



export  function buildSearchUrl(params : ItemsSearchParams) : string{
    const searchParams = new URLSearchParams()
    searchParams.append('q',params.q)
    
    return `items/search?${searchParams.toString()}`
}