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
