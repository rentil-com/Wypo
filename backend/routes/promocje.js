import { Router } from "express";
import utworzRouter from "./endpoints/promocje/utworz.js";
import listaRouter from "./endpoints/promocje/lista.js";
import szczegolyRouter from "./endpoints/promocje/szczegoly.js";
import edytujRouter from "./endpoints/promocje/edytuj.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();

router.use(
  dolaczUzytkownikaZSesji,
  wymagajZalogowania,
  tylkoAdmin
);
router.use("/", utworzRouter);
router.use("/", listaRouter);
router.use("/", szczegolyRouter);
router.use("/", edytujRouter);
router.use(obsluzBladRoutera);

export default router;
