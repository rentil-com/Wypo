import { Router } from "express";
import wypozyczRouter from "./endpoints/wypozyczenia/wypozycz.js";
import listaWnioskowRouter from "./endpoints/wypozyczenia/lista-wnioskow.js";
import szczegolyWnioskuRouter from "./endpoints/wypozyczenia/szczegoly-wniosku.js";
import decyzjaWnioskuRouter from "./endpoints/wypozyczenia/decyzja-wniosku.js";
import aktywujRouter from "./endpoints/wypozyczenia/aktywuj.js";
import zwrotRouter from "./endpoints/wypozyczenia/zwrot.js";
import przypomnienieOdbioruRouter from "./endpoints/wypozyczenia/przypomnienie-odbioru.js";
import przypomnienieZwrotuRouter from "./endpoints/wypozyczenia/przypomnienie-zwrotu.js";
import przeterminowanyZwrotRouter from "./endpoints/wypozyczenia/przeterminowany-zwrot.js";
import edytujRouter from "./endpoints/wypozyczenia/edytuj.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin,
  wymagajZalogowania
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();
const zalogowany = [dolaczUzytkownikaZSesji, wymagajZalogowania];
const administrator = [...zalogowany, tylkoAdmin];

router.use("/wypozycz", ...zalogowany, wypozyczRouter);
router.use("/wnioski", ...administrator, listaWnioskowRouter);
router.use("/wnioski", ...administrator, szczegolyWnioskuRouter);
router.use("/wnioski", ...administrator, decyzjaWnioskuRouter);
router.use("/aktywuj", ...administrator, aktywujRouter);
router.use("/zwrot", ...zalogowany, zwrotRouter);
router.use(
  "/przypomnienie-odbioru",
  ...administrator,
  przypomnienieOdbioruRouter
);
router.use(
  "/przypomnienie-zwrotu",
  ...administrator,
  przypomnienieZwrotuRouter
);
router.use(
  "/przeterminowany-zwrot",
  ...administrator,
  przeterminowanyZwrotRouter
);
router.use("/edytuj", ...administrator, edytujRouter);
router.use(obsluzBladRoutera);

export default router;
