import { apiGet, apiPatch, apiPost, apiPut } from "@/services/api";
import { LoanBody, LoanDecisionBody, LoanOverdueReminderBody, LoanPatchBody, LoanPickupReminderBody, LoanPutBody, LoanReminderResponse, LoanResponse, LoanReturnReminderBody, LoansListResponse } from "./loans.types";

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

// PATCH /wypozyczenia/wnioski/:id

export async function rozpatrzWniosek(id : number, body : LoanDecisionBody) {
    const response = await apiPatch(`/wypozyczenia/wnioski/${id}`,body)
    return response as LoanResponse
}

// POST /wypozyczenia/wnioski/:id

export async function rozpatrzWniosekPost(id : number, body : LoanDecisionBody) {
    const response = await apiPost(`/wypozyczenia/wnioski/${id}`,body)
    return response as LoanResponse
}

// POST /wypozyczenia/przypomnienie-odbioru/:id

export async function  przypomnienieOdbioru(id : number,body? : LoanPickupReminderBody){
    const response = await apiPost(`/wypozyczenia/przypomnienie-odbioru/${id}`,body)
    return response as  LoanReminderResponse
}

// POST /wypozyczenia/przypomnienie-zwrotu/:id

export async function  przypomnienieZwrotu(id : number, body?: LoanReturnReminderBody){
    const response = await apiPost(`/wypozyczenia/przypomnienie-zwrotu/${id}`,body)
    return response as LoanReminderResponse
}

// POST /wypozyczenia/przeterminowany-zwrot/:id

export async function  przeterminowanyZwrot(id : number, body?: LoanOverdueReminderBody){
    const response = await apiPost(`/wypozyczenia/przeterminowany-zwrot/${id}`,body)
    return response as LoanReminderResponse
}

// PATCH /wypozyczenia/edytuj/:id

export async function edytujWypozyczenie(id : number, body :  LoanPatchBody) {
    const response = await apiPatch(`/wypozyczenia/edytuj/${id}`,body)
    return response as LoanResponse
}

// PUT /wypozyczenia/edytuj/:id

export async function nadpiszWypozyczenie(id : number, body : LoanPutBody) {
    const response = await apiPut(`/wypozyczenia/edytuj/${id}`,body)
    return response as LoanResponse
}

// PATCH /wypozyczenia/aktywuj/:id

export async function aktywujWypozyczenie(id : number) {
    const response = await apiPatch(`/wypozyczenia/aktywuj/${id}`,{})
    return response as LoanResponse
}

// POST /wypozyczenia/aktywuj/:id

export async function aktywujWypozyczeniePost(id : number) {
    const response = await apiPost(`/wypozyczenia/aktywuj/${id}`)
    return response as LoanResponse
}

// PATCH /wypozyczenia/zwrot/:id

export async function zwrocWypozyczenie(id : number) {
    const response = await apiPatch(`/wypozyczenia/zwrot/${id}`,{})
    return response as LoanResponse
}

// POST /wypozyczenia/zwrot/:id

export async function zwrocWypozyczeniePost(id : number) {
    const response = await apiPost(`/wypozyczenia/zwrot/${id}`)
    return response as LoanResponse
}
