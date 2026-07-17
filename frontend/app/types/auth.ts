export type LoginBody = {
    email : string,
    password : string
}

export type SessionUser = {
  id: number;
  email: string;
  rola: UserRole;
};

export type LoginSuccessResponse = {
  message: string;
  user: SessionUser;
};

export type UserRole =  "uzytkownik" | "admin"


export type Login2FAResponse = {
  message: string;
  requires_2fa: true;
  challenge: string;
  expires_in: number;
  max_attempts: number;
};

export type AuthResponse =
  | LoginSuccessResponse
  | Login2FAResponse;