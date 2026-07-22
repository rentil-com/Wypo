import type { AccountDetails } from "@features/account";

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
