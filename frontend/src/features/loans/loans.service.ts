import { apiGet, apiPost } from "@/services/api";
import { LoanBody, LoanPickupReminderBody, LoanResponse, LoanReturnReminderBody, LoansListResponse } from "./loans.types";

//  POST/wypozyczenia/wypozycz
export async function zlozWniosekOWypozyczenie(body : LoanBody) {
    const response = await apiPost("/wypozyczenia/wypozycz",body)
    return response as LoanResponse
}

// GET/wypozyczenia/wnioski


export async function pobierzWnioski() {
    const response = await apiGet("/wypozyczenia/wnioski")
    return response as LoansListResponse
}

// GET /wypozyczenia/wnioski/:id
export async function pobierzWypozyczeniePoId(id : number) {
    const response = await apiGet(`/wypozyczenia/wnioski/${id}`)
    return response as LoanResponse
    
}

// POST /wypozyczenia/przypomnienie-odbioru/:id

export async function  przypomnienieOdbioru(id : number,body : LoanPickupReminderBody){
    const response = await apiPost(`/wypozyczenia/przypomnienie-odbioru/${id}`,body)
    return response as LoanResponse
}

// POST /wypozyczenia/przypomnienie-zwrotu/:id

export async function  przypomnienieZwrotu(id : number, body : LoanReturnReminderBody){
    const response = await apiPost(`/wypozyczenia/przypomnienie-zwrotu/${id}`,body)
    return response as LoanResponse
}