import { apiPost, apiGet ,apiPatch,apiDelete} from "@/services/api";

import { AccountDetails, AccountEditBody, AccountEmailChange, AccountEmailChangeResponse, EmailChangeConfirm, EmailChangeConfirmResponse, two_FaResponse, DeleteAccountResponse } from "./account.types";


// GET /account/details
export async function getCurrentUser() {
  const response = await apiGet("/account/details");

  return response as AccountDetails;
}


// PATCH /account/edit/:id
export async function updateAccount(id : number, imie : string | null, nazwisko : string | null) {
    const poprawneImie = imie?.trim()
    const poprawneNazwisko = nazwisko?.trim()
    const body : AccountEditBody = {
        imie : poprawneImie,
        nazwisko : poprawneNazwisko
    }
    const response = await apiPatch(`/account/edit/${id}`,body)

    return response as AccountDetails
}

// POST /account/email-change
export async function  startEmailChange(new_email : string, password : string) {
    const poprawnyEmail = new_email.trim()

    const body : AccountEmailChange = {
        new_email : poprawnyEmail,
        password : password
    }
    const response = await apiPost(`/account/email-change`,body)

    return response as AccountEmailChangeResponse
}


// POST /account/email-change/confirm
export async function emailChangeConfirm(wyzwanie: string, kod : string) {
    const poprawnyKod = kod.trim()

    if(!/^[0-9]{6}$/.test(poprawnyKod)){
    throw new Error("Kod musi sie skladac tylko z 6 cyfr")
   }

   const body : EmailChangeConfirm = {
    wyzwanie : wyzwanie,
    kod : poprawnyKod
   }

   const response = await apiPost("/account/email-change/confirm",body)

   return response as EmailChangeConfirmResponse
    
}


// POST /auth/2fa/enable
export async function włacz_2fa() {
    const response = await apiPost("/auth/2fa/enable")
    return response as two_FaResponse
}


// POST /auth/2fa/disable
export async function wyłącz_2fa() {
    const response = await apiPost("/auth/2fa/disable")
    return response as two_FaResponse
}

// DELETE /account/delete/:id
export async function usunKonto(id : number) {
    const response = await apiDelete(`/account/delete/${id}`)
    return response as DeleteAccountResponse
}
