import { apiPost } from "@/services/api";

import { LoginBody,AuthResponse, LogoutResponse, Confirm2FABody, LoginSuccessResponse } from "./auth.types";


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
