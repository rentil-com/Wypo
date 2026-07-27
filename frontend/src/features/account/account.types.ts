import type { UserRole } from "@features/auth";

// Dane zalogowanego uzytkownika
export type AccountDetails =  {
  id: number;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  dwuetapowe: boolean;
  data_utworzenia: string;
}

// Body edycji konta
export type AccountEditBody = {
  imie? : string,
  nazwisko? : string
  email?: string;
  password?: string;
  rola?: UserRole;
}
// Body rozpoczecia zmiany adresu e-mail
export type AccountEmailChange = {
  new_email : string, 
  password : string
}
// Odpowiedz rozpoczecia zmiany adresu e-mail
export type AccountEmailChangeResponse = {
  message: string;
  challenge: string;
  expires_in: number;
  max_attempts: number;
}

// Body potwierdzenia zmiany adresu e-mail
export type EmailChangeConfirm = {
  wyzwanie : string,
  kod : string
}

// Odpowiedz potwierdzenia zmiany adresu e-mail
export type EmailChangeConfirmResponse = {
  message: string;
  email: string;
};


// Odpowiedz zmiany ustawienia 2FA
export type two_FaResponse = {
  message : string,
  dwuetapowe : boolean
}


// Odpowiedz usuniecia konta
export type DeleteAccountResponse = {
  id: number;
  imie: string;
  nazwisko: string;
  email: string;
  rola: UserRole;
  dwuetapowe: boolean;
  data_utworzenia: string;
}

export type AccountListParams = {
  strona?: number;
  imie?: string;
  nazwisko?: string;
  email?: string;
  rola?: UserRole;
}

export type AccountsListFilters = {
  imie: string | null;
  nazwisko: string | null;
  email: string | null;
  rola: UserRole | null;
};

export type AccountsListResponse = {
  strona: number;
  limitKontNaStrone: number;
  filtry: AccountsListFilters;
  total: number;
  liczbaStron: number;
  dane: AccountDetails[];
};

// PATCH /account/edit/:id
export type AccountPatchBody = AccountEditBody;

// PUT /account/edit/:id
export type AccountPutBody = AccountEditBody;

// GET /account/details/:id
export type AccountDetailsByIdResponse = AccountDetails;

