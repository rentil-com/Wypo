import { apiPost } from "@/services/api";

import { PasswordResetConfirmResponse, PasswordResetBody, PasswordReset, PasswordResetConfirm } from "./password-reset.types";


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
