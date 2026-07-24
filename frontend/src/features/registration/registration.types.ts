import type { AccountDetails } from "@features/account";

// Body utworzenia konta
export type AccountCreate ={
  imie : string,
  nazwisko : string,
  email : string
  password : string,
}

// Odpowiedz rozpoczecia rejestracji
export type AccountCreateResponse = {
  message : string,
  expires_in : number,
  max_attempts : number
}

// Body potwierdzenia rejestracji
export type AccountCreateConfirm = {
  email : string, 
  kod : string
}

// Odpowiedz potwierdzenia rejestracji
export type AccountCreateSuccessResponse = {
  message : string,
  user : AccountDetails
}
