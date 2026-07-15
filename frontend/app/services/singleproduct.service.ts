import { apiGet } from "./api";
import type {SingleProductApiItem  } from "@/types/singleproduct";
export async function pobierzPojedynczyProdukt (id : number) {
    const response = await apiGet(`/items/${id}`);

    return response as SingleProductApiItem
}