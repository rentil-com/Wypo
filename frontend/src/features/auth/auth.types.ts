// Body logowania
export type LoginBody = {
    email : string,
    password : string
}

// Uzytkownik zapisany w sesji
export type SessionUser = {
  id: number;
  email: string;
  rola: UserRole;
};

// Odpowiedz poprawnego logowania
export type LoginSuccessResponse = {
  message: string;
  user: SessionUser;
};

// Role uzytkownikow
export type UserRole =  "uzytkownik" | "admin"


// Odpowiedz wymagajaca potwierdzenia 2FA
export type Login2FAResponse = {
  message: string;
  requires_2fa: true;
  challenge: string;
  expires_in: number;
  max_attempts: number;
};

// Mozliwe odpowiedzi logowania
export type AuthResponse =
  | LoginSuccessResponse
  | Login2FAResponse;


// Odpowiedz wylogowania
export type LogoutResponse = {
    message : string
}


// Body potwierdzenia 2FA
export type Confirm2FABody = {
    wyzwanie: string;
    kod: string;
}


// Stan uwierzytelnienia w aplikacji
export type AuthStatus =
  | "loading"
  | "anonymous"
  | "awaiting_2fa"
  | "authenticated";
