import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";

import type { ReactNode } from "react";
import { login as LoginRequest, logout as LogoutRequest, confirm2FA, confirm2FA as confirma2FARequest, getCurrentUser } from "@/services/auth.service";
import { AuthStatus, SessionUser } from "@/types/auth";

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  challenge: string | null;
  error: string | null;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verify2FA: (kod: string) => Promise<void>;
  clearSession: () => void;
};


type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({children,} : AuthProviderProps) {

const [status,setStatus] = useState<AuthStatus>("loading")
const [user,setUser] = useState<SessionUser | null>(null)
const [challenge,setChallenge] = useState<string | null>(null)
const [error,setError] = useState<string |  null>(null)

const clearSession = useCallback(() => {
  setUser(null);
  setChallenge(null);
  setError(null);
  setStatus("anonymous");
}, []);


 const refreshSession = useCallback(async () => {
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
    
},[])


 async function signIn(email : string , password : string) {
    setStatus("loading")
    setError(null)
    setChallenge(null);

    try {
        const response = await LoginRequest(email, password)
        if("requires_2fa" in response){
            setChallenge(response.challenge)
            setStatus("awaiting_2fa")
            
        }
        else {
          
         const account = await getCurrentUser();

      setUser({
        id: account.id,
        email: account.email,
        rola: account.rola,
      });
  setStatus("authenticated");

        }
    }
    catch(error) {
        setUser(null)
    setStatus("anonymous")
     setChallenge(null);

    setError(error instanceof Error ? error.message : "Nieznany błąd")
    }
}



 async function signOut() {
    setStatus("loading")
    setError(null)
    try {
        await LogoutRequest()
        setUser(null)
        setChallenge(null)
        setStatus("anonymous")
    }
    catch(error) {
        setStatus("authenticated");

        setError(error instanceof Error ? error.message : "Nieznany błąd")
    }

    
}


 async function verify2FA( kod : string) {
    setStatus("loading")
    setError(null)
    if (!challenge) {
  setStatus("anonymous");
  setError("Brak aktywnego logowania 2FA");
  return;
}
    try {
       

        const response = await confirma2FARequest(challenge,kod)
        setUser(response.user)
        setChallenge(null)
        setStatus("authenticated")
        
    }
    catch(error) {
        setStatus("awaiting_2fa");
        setError(error instanceof Error ? error.message : "Nieznany błąd")
    }
    
}
useEffect(()=> {
 void refreshSession()   
},[refreshSession])
 return (
    <AuthContext.Provider
      value={{
        status,
        user,
        challenge,
        error,
        refreshSession,
        signIn,
        signOut,
        verify2FA,
        clearSession
      }}
    >
      {children}
    </AuthContext.Provider>
 )
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth musi być użyty wewnątrz AuthProvider"
    );
  }

  return context;
}