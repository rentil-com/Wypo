import { Router } from "express";
import dodajRouter from "./endpoints/recenzje/dodaj.js";
import listaSprzetuRouter from "./endpoints/recenzje/lista-sprzetu.js";
import mojeRouter from "./endpoints/recenzje/moje.js";
import listaRouter from "./endpoints/recenzje/lista.js";
import ukryjRouter from "./endpoints/recenzje/ukryj.js";
import odkryjRouter from "./endpoints/recenzje/odkryj.js";
import usunRouter from "./endpoints/recenzje/usun.js";
import szczegolyRouter from "./endpoints/recenzje/szczegoly.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";

const router = Router();
const zalogowany = [dolaczUzytkownikaZSesji, wymagajZalogowania];
const administrator = [...zalogowany, tylkoAdmin];

router.use("/dodaj", ...zalogowany, dodajRouter);
router.use("/sprzet", listaSprzetuRouter);
router.use("/moje", ...zalogowany, mojeRouter);
router.use("/ukryj", ...administrator, ukryjRouter);
router.use("/odkryj", ...administrator, odkryjRouter);
router.use("/usun", ...zalogowany, usunRouter);

// GET /recenzje jest administracyjny. Musi być przed GET /recenzje/:id.
router.get("/", ...administrator, listaRouter);

// Szczegóły są publiczne dla aktywnych recenzji, ale dla pozostałych
// odpowiedź zależy od sesji właściciela lub administratora.
router.use("/", dolaczUzytkownikaZSesji, szczegolyRouter);
router.use(obsluzBladRoutera);

export default router;
