import { apiDelete, apiFormData, apiGet, apiPatch, apiPut } from "@/services/api";
import { AddProductPhotosResponse, AddProductResponse, DeleteProductPhotosBody, DeleteProductPhotosResponse, DeleteProductResponse, GetDeletableProductsResponse, PatchProductBody, PatchProductResponse, PutProductBody, PutProductResponse } from "./products.management.types";

// POST /items/dodaj
export async function dodajProdukt(formData : FormData) {
    const response = await apiFormData("/items/dodaj","POST",formData)

    return response as AddProductResponse
}

// PATCH /items/edit/:id
export async function edytujProdukt(id : number, body : PatchProductBody) {

    const response = await apiPatch(`/items/edit/${id}`,body)
    return response as PatchProductResponse    
}

// PUT /items/edit/:id
export async function nadpiszProdukt(id : number, body : PutProductBody) {
    const response = await apiPut(`/items/edit/${id}`,body)
    return response as PutProductResponse
    
}

// DELETE /items/usun/:id
export async function usunProdukt(id : number) {
    const response = await apiDelete(`/items/usun/${id}`)

    return response as DeleteProductResponse
    
}

// GET /items/usun
export async function pobierzUsuwalneProdukty() {
    const response = await apiGet("/items/usun")
    return response as GetDeletableProductsResponse
}

// POST /items/add_photos/:id
export async function dodajZdjeciaProduktu(id: number, formData: FormData,) {
  const response = await apiFormData( `/items/add_photos/${id}`,"POST",formData,);

  return response as AddProductPhotosResponse;
}

// DELETE /items/delete_photos/:id
export async function usunZdjeciaProduktu(id: number,body: DeleteProductPhotosBody) {
  const response = await apiDelete(`/items/delete_photos/${id}`,body);

  return response as DeleteProductPhotosResponse;
}
