// Body rozpoczecia resetu hasla
export type PasswordResetBody = {
  email: string;
};

// Odpowiedz rozpoczecia resetu hasla
export type PasswordReset = {
  message : string,
  challenge : string,
  expires_in : number,
  max_attempts : number
}

// Body potwierdzenia resetu hasla
export type PasswordResetConfirm = {
  challenge : string,
  code : string,
  password : string
}

// Odpowiedz potwierdzenia resetu hasla
export type PasswordResetConfirmResponse = {
  message: string;
};
