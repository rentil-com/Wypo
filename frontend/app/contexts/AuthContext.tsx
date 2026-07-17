import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

import { login as LoginRequest, logout as LogoutRequest, confirm2FA as confirma2FARequest, getCurrentUser } from "@/services/auth.service";
import { AuthStatus, SessionUser } from "@/types/auth";

const [status,setStatus] = useState<AuthStatus>("loading")
const [user,setUser] = useState<SessionUser | null>(null)
const [challenge,setChallenge] = useState<string | null>(null)
const [error,setError] = useState<string |  null>(null)

export async function refreshSession() {
 setStatus("loading")
 setError(null)

 try {
    const response = await getCurrentUser()
    setUser(response)
    setStatus("authenticated")
 }
 catch(error){
    setUser(null)
    setStatus("anonymous")

    setError(error instanceof Error ? error.message : "Nieznany błąd")
 }
    
}