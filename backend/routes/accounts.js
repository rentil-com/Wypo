import { Router } from "express";
import utworzRouter from "./endpoints/accounts/utworz.js";
import listaRouter from "./endpoints/accounts/lista.js";
import mojeSzczegolyRouter from "./endpoints/accounts/moje-szczegoly.js";
import szczegolyRouter from "./endpoints/accounts/szczegoly.js";
import edytujRouter from "./endpoints/accounts/edytuj.js";
import usunRouter from "./endpoints/accounts/usun.js";
import zmianaEmailRouter from "./endpoints/accounts/zmiana-email.js";
import potwierdzZmianeEmailRouter from "./endpoints/accounts/potwierdz-zmiane-email.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();
const zalogowany = [dolaczUzytkownikaZSesji, wymagajZalogowania];
const administrator = [...zalogowany, tylkoAdmin];

router.use("/create", utworzRouter);
router.use("/email-change/confirm", ...zalogowany, potwierdzZmianeEmailRouter);
router.use("/email-change", ...zalogowany, zmianaEmailRouter);
router.use("/details/all", ...administrator, listaRouter);
router.use("/details", ...zalogowany, mojeSzczegolyRouter);
router.use("/details", ...zalogowany, szczegolyRouter);
router.use("/edit", ...zalogowany, edytujRouter);
router.use("/delete", ...zalogowany, usunRouter);
router.use(obsluzBladRoutera);

export default router;
