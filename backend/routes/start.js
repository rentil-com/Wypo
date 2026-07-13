import { Router } from "express";
import status from "./endpoints/start/status.js";
import { obsluzBladRoutera } from "../middleware/error-handler.js";

const router = Router();

router.use("/", status);
router.use(obsluzBladRoutera);

export default router;
