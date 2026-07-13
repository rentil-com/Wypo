import { Router } from "express";
import dodajRouter from "./endpoints/kategorie/dodaj.js";
import edytujRouter from "./endpoints/kategorie/edytuj.js";
import usunRouter from "./endpoints/kategorie/usun.js";
import listaUsuwalnychRouter from "./endpoints/kategorie/lista-usuwalnych.js";
import listaRouter from "./endpoints/kategorie/lista.js";
import szczegolyRouter from "./endpoints/kategorie/szczegoly.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();
const administrator = [dolaczUzytkownikaZSesji, tylkoAdmin];

router.use("/dodaj", ...administrator, dodajRouter);
router.use("/edit", ...administrator, edytujRouter);
router.use("/usun", ...administrator, listaUsuwalnychRouter);
router.use("/usun", ...administrator, usunRouter);
router.use("/", listaRouter);
router.use("/", szczegolyRouter);
router.use(obsluzBladRoutera);

export default router;
