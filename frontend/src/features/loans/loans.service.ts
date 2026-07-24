import { apiPost } from "@/services/api";
import { LoanBody, LoanResponse } from "./loans.types";

//  POST/wypozyczenia/dodaj
export async function zlozWniosekOWypozyczenie(body : LoanBody) {
    const response = await apiPost("/wypozyczenia/wypozycz",body)
    return response as LoanResponse
}