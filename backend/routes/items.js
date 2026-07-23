import { Router } from "express";
import dodajRouter from "./endpoints/items/dodaj.js";
import edytujRouter from "./endpoints/items/edytuj.js";
import dodajZdjeciaRouter from "./endpoints/items/dodaj-zdjecia.js";
import usunZdjeciaRouter from "./endpoints/items/usun-zdjecia.js";
import usunRouter from "./endpoints/items/usun.js";
import listaUsuwalnychRouter from "./endpoints/items/lista-usuwalnych.js";
import wyszukajRouter from "./endpoints/items/wyszukaj.js";
import listaRouter from "./endpoints/items/lista.js";
import szczegolyRouter from "./endpoints/items/szczegoly.js";
import {
  dolaczUzytkownikaZSesji,
  tylkoAdmin
} from "../middleware/session.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();
const administrator = [dolaczUzytkownikaZSesji, tylkoAdmin];

router.use("/dodaj", ...administrator, dodajRouter);
router.use("/edit", ...administrator, edytujRouter);
router.use("/add_photos", ...administrator, dodajZdjeciaRouter);
router.use("/delete_photos", ...administrator, usunZdjeciaRouter);
router.use("/usun", ...administrator, listaUsuwalnychRouter);
router.use("/usun", ...administrator, usunRouter);

// Publiczne odpowiedzi uwzgledniaja promocje aktualnej sesji, jezeli istnieje.
router.use(dolaczUzytkownikaZSesji);
router.use("/search", wyszukajRouter);
router.use("/", listaRouter);
router.use("/", szczegolyRouter);
router.use(obsluzBladRoutera);

export default router;
