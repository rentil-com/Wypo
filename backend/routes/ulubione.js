import { Router } from "express";
import polubRouter from "./endpoints/ulubione/polub.js";
import odlubRouter from "./endpoints/ulubione/odlub.js";
import listaRouter from "./endpoints/ulubione/lista.js";
import listaUzytkownikaRouter from "./endpoints/ulubione/lista-uzytkownika.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();
const zalogowany = [dolaczUzytkownikaZSesji, wymagajZalogowania];
const administrator = [...zalogowany, tylkoAdmin];

router.use("/polub", ...zalogowany, polubRouter);
router.use("/odlub", ...zalogowany, odlubRouter);
router.get("/", ...zalogowany, listaRouter);
router.use("/", ...administrator, listaUzytkownikaRouter);
router.use(obsluzBladRoutera);

export default router;
