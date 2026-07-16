import { ItemsQueryParams, ItemsSearchParams } from "@/types/product";

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
    
   return `/items/search?${searchParams.toString()}`;
}


export function buildParamsUrl(params : ItemsQueryParams) : string {
    const query = new URLSearchParams()
    if(params.nazwa?.trim()){
        query.append("nazwa",params.nazwa?.toString())
    }
    if(params.kategoria != null){
        query.append("kategoria",params.kategoria?.toString())
    }
    if(params.status?.trim()){
        query.append("status",params.status?.toString())
    }
    if (params.cena_od != null) {
        query.append("cena_od", params.cena_od.toString());
    }

    if (params.cena_do != null) {
        query.append("cena_do", params.cena_do.toString());
    }

    if (params.promocja === true) {
        query.append("promocja", "true");
    }

    if (params.strona != null && params.strona > 0) {
        query.append("strona", params.strona.toString());
    }

    const queryString = query.toString();
    return queryString ? `/items?${queryString}` : "/items";
}