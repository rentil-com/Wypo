import { apiPost } from "./api";
import { LoginBody,AuthResponse, LogoutResponse } from "@/types/auth";


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
}