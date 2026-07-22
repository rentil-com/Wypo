import type { UserRole } from "@features/auth";

export type AccountDetails =  {
  id: number;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  dwuetapowe: boolean;
  data_utworzenia: string;
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
