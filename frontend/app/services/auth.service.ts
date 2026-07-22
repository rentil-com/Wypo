import { apiPost, apiGet ,apiPatch} from "./api";

import { LoginBody,AuthResponse, LogoutResponse, Confirm2FABody, LoginSuccessResponse, AccountDetails, AccountCreate, AccountCreateConfirm, AccountCreateResponse, AccountCreateSuccessResponse, AccountEditBody, AccountEmailChange, AccountEmailChangeResponse, EmailChangeConfirm, EmailChangeConfirmResponse, PasswordResetConfirmResponse, PasswordResetBody, PasswordReset, PasswordResetConfirm, two_FaResponse } from "@/types/auth";


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

export async function  startEmailChange(new_email : string, password : string) {
    const poprawnyEmail = new_email.trim()

    const body : AccountEmailChange = {
        new_email : poprawnyEmail,
        password : password
    }
    const response = await apiPost(`/account/email-change`,body)

    return response as AccountEmailChangeResponse
}


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

export async function startPasswordReset(email : string) {
    const poprawnyEmail = email.trim().toLowerCase()
    if(!poprawnyEmail){
        throw new Error("E-mail nie moze byc pusty")
    }

    const body : PasswordResetBody= {
    email : poprawnyEmail
    }
    const response = await apiPost("/auth/password-reset",body)
    return response as PasswordReset
}

export async function passwordResetConfirm(challenge : string, code : string, password : string) {
    const poprawnyKod = code.trim()
    if(!/^[0-9]{6}$/.test(poprawnyKod)){
    throw new Error("Kod musi sie skladac tylko z 6 cyfr")
   }
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if(!passwordRegex.test(password)){
        throw new Error("Hasło powinno sie składac conajmniej z 8 znaków, 1 wielkiej litery, 1 małej, 1 znaku specjalnego.")
    }

    const body : PasswordResetConfirm = {
        challenge : challenge,
        code : poprawnyKod,
        password : password
    }

    const response = await apiPost("/auth/password-reset/confirm",body)
    return response as PasswordResetConfirmResponse


    
}


export async function włacz_2fa() {
    const response = await apiPost("/auth/2fa/enable")
    return response as two_FaResponse
}


export async function wyłącz_2fa() {
    const response = await apiPost("/auth/2fa/disable")
    return response as two_FaResponse
}