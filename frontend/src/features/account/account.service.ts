import { apiPost, apiGet, apiPatch, apiPut, apiDelete } from "@/services/api";

import { AccountDetails, AccountDetailsByIdResponse, AccountEditBody, AccountEmailChange, AccountEmailChangeResponse, AccountPatchBody, AccountPutBody, EmailChangeConfirm, EmailChangeConfirmResponse, two_FaResponse, DeleteAccountResponse, AccountListParams, AccountsListResponse } from "./account.types";


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

export async function getAllAccounts(params: AccountListParams = {},) {
  const query = new URLSearchParams();
  if (params.strona) query.set("strona", params.strona.toString());
  if (params.imie?.trim()) query.set("imie", params.imie.trim());
  if (params.nazwisko?.trim()) query.set("nazwisko", params.nazwisko.trim());
  if (params.email?.trim()) query.set("email", params.email.trim());
  if (params.rola) query.set("rola", params.rola);

  const queryString = query.toString();
  const response = await apiGet(
    `/account/details/all${queryString ? `?${queryString}` : ""}`,
  );

  return response as AccountsListResponse;
}

// GET /account/details/:id
export async function getAccountById(id: number) {
  const response = await apiGet(`/account/details/${id}`);
  return response as AccountDetailsByIdResponse;
}

// PATCH /account/edit/:id
export async function patchAccount(id: number, body: AccountPatchBody) {
  const response = await apiPatch(`/account/edit/${id}`, body);
  return response as AccountDetails;
}

// PUT /account/edit/:id
export async function putAccount(id: number, body: AccountPutBody) {
  const response = await apiPut(`/account/edit/${id}`, body);
  return response as AccountDetails;
}
