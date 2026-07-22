import { apiPost } from "@/services/api";

import { AccountCreate, AccountCreateConfirm, AccountCreateResponse, AccountCreateSuccessResponse } from "./registration.types";


export async function register(imie : string, nazwisko : string, email : string, password : string) {
    const poprawnyEmail = email.trim().toLowerCase();
    const poprawneImie = imie.trim()
    const poprawneNazwisko = nazwisko.trim()
    if (!poprawnyEmail || !password || !poprawneImie || !poprawneNazwisko) {
        throw new Error("wszystkie pola  są wymagane");
    }
    const body : AccountCreate = {
        imie : poprawneImie,
        nazwisko : poprawneNazwisko,
        email : poprawnyEmail,
        password : password
    }
    const response = await apiPost("/account/create",body)
    return response as AccountCreateResponse
}

export async function registerConfirm(email: string, kod : string) {
    const poprawnyEmail = email.trim().toLowerCase();
    const poprawnyKod = kod.trim();

    if (!poprawnyEmail ) {
        throw new Error("Email jest wymagany");
    }

   if(!/^[0-9]{6}$/.test(poprawnyKod)){
    throw new Error("Kod musi sie skladac tylko z 6 cyfr")
   }

    const body : AccountCreateConfirm  = {
        email : poprawnyEmail,
        kod : poprawnyKod,
    }
  


    const response = await apiPost("/auth/register-confirm",body) 
      return response as AccountCreateSuccessResponse   
}
