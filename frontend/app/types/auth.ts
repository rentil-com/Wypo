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


export type LogoutResponse = {
    message : string
}


export type Confirm2FABody = {
    wyzwanie: string;
    kod: string;
}



export type AccountDetails =  {
  id: number;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  dwuetapowe: boolean;
  data_utworzenia: string;
}

export type AuthStatus =
  | "loading"
  | "anonymous"
  | "awaiting_2fa"
  | "authenticated";


export type AccountCreate ={
  imie : string,
  nazwisko : string,
  email : string
  password : string,
}


export type AccountCreateResponse = {
  message : string,
  expires_in : number,
  max_attempts : number
}


export type AccountCreateConfirm = {
  email : string, 
  kod : string
}

export type AccountCreateSuccessResponse = {
  message : string,
  user : AccountDetails
}


export type AccountEditBody = {
  imie? : string,
  nazwisko? : string
}
export type AccountEmailChange = {
  new_email : string, 
  password : string
}
export type AccountEmailChangeResponse = {
  message: string;
  challenge: string;
  expires_in: number;
  max_attempts: number;
}

export type EmailChangeConfirm = {
  wyzwanie : string,
  kod : string
}

export type EmailChangeConfirmResponse = {
  message: string;
  email: string;
};

export type PasswordResetBody = {
  email: string;
};

export type PasswordReset = {
  message : string,
  challenge : string,
  expires_in : number,
  max_attempts : number
}

export type PasswordResetConfirm = {
  challenge : string,
  code : string,
  password : string
}

export type PasswordResetConfirmResponse = {
  message: string;
};


export type two_FaResponse = {
  message : string,
  dwuetapowe : boolean
}


export type DeleteAccountResponse = {
  id: number;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  dwuetapowe: boolean;
  data_utworzenia: string;
}

