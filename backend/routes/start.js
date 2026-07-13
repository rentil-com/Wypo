import { Router } from "express";
import listaKategoriiRouter from "./endpoints/start/lista-kategorii.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();

router.use("/", listaKategoriiRouter);
router.use(obsluzBladRoutera);

export default router;
