import { apiDelete, apiFormData, apiGet, apiPatch, apiPut } from "@/services/api";
import { AddProductResponse, DeleteProductPhotosBody, DeleteProductResponse, GetDeletableProductsResponse, PatchProductBody, PatchProductResponse, PutProductBody } from "./products-admin.types";

export async function dodajProdukt(formData : FormData) {
    const response = await apiFormData("/items/dodaj","POST",formData)

    return response as AddProductResponse
}

export async function edytujProdukt(id : number, body : PatchProductBody) {

    const response = await apiPatch(`/items/edit/${id}`,body)
    return response as PatchProductResponse    
}


export async function nadpiszProdukt(id : number, body : PutProductBody) {
    const response = await apiPut(`/items/edit/${id}`,body)
    return response as PutProductBody
    
}


export async function usunProdukt(id : number) {
    const response = await apiDelete(`/items/usun/${id}`)

    return response as DeleteProductResponse
    
}

export async function pobierzUsuwalneProdukty() {
    const response = await apiGet("/items/usun")
    return response as GetDeletableProductsResponse
}

export async function dodajZdjeciaProduktu(id: number, formData: FormData,) {
  const response = await apiFormData( `/items/add_photos/${id}`,"POST",formData,);

  return response as AddProductResponse;
}

export async function usunZdjeciaProduktu(id: number,body: DeleteProductPhotosBody) {
  const response = await apiDelete(`/items/delete_photos/${id}`,body);

  return response as DeleteProductResponse;
}