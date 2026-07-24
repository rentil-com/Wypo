import { apiGet, apiPost } from "@/services/api";
import { LoanBody, LoanResponse, LoansListResponse } from "./loans.types";

//  POST/wypozyczenia/dodaj
export async function zlozWniosekOWypozyczenie(body : LoanBody) {
    const response = await apiPost("/wypozyczenia/wypozycz",body)
    return response as LoanResponse
}

// GET/wypozyczenia/wnioski


export async function pobierzWnioski() {
    const response = await apiGet("/wypozyczenia/wnioski")
    return response as LoansListResponse
}