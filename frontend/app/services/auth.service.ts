import { apiPost, apiGet } from "./api";

import { LoginBody,AuthResponse, LogoutResponse, Confirm2FABody, LoginSuccessResponse, AccountDetails, AccountCreate, AccountCreateConfirm, AccountCreateResponse, AccountCreateSuccessResponse } from "@/types/auth";


export async function login(email : string, password : string) {
    const poprawnyEmail = email.trim().toLowerCase();

    if (!poprawnyEmail || !password) {
        throw new Error("Email i hasło są wymagane");
    }
    const body : LoginBody = {
        email : poprawnyEmail,
        password : password
    }
    const response = await apiPost("/auth/login",body)


    return response as AuthResponse
}


export async function logout() {
    const response = await apiPost("/auth/logout",{})

    return response as LogoutResponse
}


export async function confirm2FA(wyzwanie : string, kod : string) {
    if (!wyzwanie || !/^[0-9]{6}$/.test(kod)) {
    throw new Error("Podaj poprawny sześciocyfrowy kod");
    }

    const body : Confirm2FABody = {
        wyzwanie, kod
    }

    const response = await apiPost("/auth/2fa",body)

    return response as LoginSuccessResponse
}



export async function getCurrentUser() {
  const response = await apiGet("/account/details");

  return response as AccountDetails;
}


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

    if (!poprawnyEmail ) {
        throw new Error("Email jest wymagany");
    }

   if(!/^[0-9]{6}$/.test(kod) || kod.length !=6){
    throw new Error("Kod musi sie skladac tylko z 6 cyfr")
   }

    const body : AccountCreateConfirm  = {
        email : poprawnyEmail,
        kod : kod,
    }
  


    const response = await apiPost("/auth/register-confirm",body) 
      return response as AccountCreateSuccessResponse   
}