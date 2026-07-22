import { apiGet } from "@/services/api";
import type {SingleProductApiItem  } from "./singleproduct.types";
export async function pobierzPojedynczyProdukt (id : number) {
    const response = await apiGet(`/items/${id}`);

    return response as SingleProductApiItem
}
