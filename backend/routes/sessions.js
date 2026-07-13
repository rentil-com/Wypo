import { Router } from "express";
import potwierdzRejestracjeRouter from "./endpoints/sessions/potwierdz-rejestracje.js";
import loginRouter from "./endpoints/sessions/login.js";
import potwierdz2faRouter from "./endpoints/sessions/potwierdz-2fa.js";
import wlacz2faRouter from "./endpoints/sessions/wlacz-2fa.js";
import wylacz2faRouter from "./endpoints/sessions/wylacz-2fa.js";
import logoutRouter from "./endpoints/sessions/logout.js";
import resetHaslaRouter from "./endpoints/sessions/reset-hasla.js";
import potwierdzResetHaslaRouter from "./endpoints/sessions/potwierdz-reset-hasla.js";
import {
  dolaczUzytkownikaZSesji,
  wymagajZalogowania
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

export {
  hashujTokenSesji,
  pobierzRoleZSesji,
  pobierzUzytkownikaZSesji
} from "../services/sessions.js";

const router = Router();
const zalogowany = [dolaczUzytkownikaZSesji, wymagajZalogowania];

router.use("/register-confirm", potwierdzRejestracjeRouter);
router.use("/login", loginRouter);
router.use("/password-reset/confirm", potwierdzResetHaslaRouter);
router.use("/password-reset", resetHaslaRouter);
router.use("/2fa/enable", ...zalogowany, wlacz2faRouter);
router.use("/2fa/disable", ...zalogowany, wylacz2faRouter);
router.use("/2fa", potwierdz2faRouter);
router.use("/logout", logoutRouter);
router.use(obsluzBladRoutera);

export default router;
