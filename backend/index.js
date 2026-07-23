import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import start from "./routes/start.js";
import authSession from "./routes/sessions.js";
import items from "./routes/items.js";
import kategorie from "./routes/kategorie.js";
import accounts from "./routes/accounts.js";
import ulubione from "./routes/ulubione.js";
import wypozyczenia from "./routes/wypozyczenia.js";
import recenzje from "./routes/recenzje.js";
import promocje from "./routes/promocje.js";
import { utworzRouterWorkera } from "./routes/worker.js";
import { utworzKlientaApiWorkeraZEnv } from "./services/worker-api.js";
import cors from "cors";
import { obsluzBladRoutera } from "./middleware/error-handler.js";
import { pobierzDodatniaLiczbeCalkowitaEnv } from "./helpers/env.js";

const app = express();
const port = pobierzDodatniaLiczbeCalkowitaEnv("SERVER_PORT", 3000);
const host = process.env.SERVER_HOST || "0.0.0.0";
const klientApiWorkera = utworzKlientaApiWorkeraZEnv();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:8081",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(express.json());
app.use(cookieParser());

app.use("/", start);
app.use("/auth", authSession);
app.use("/items", items);
app.use("/kategorie", kategorie);
app.use("/account", accounts);
app.use("/ulubione", ulubione);
app.use("/wypozyczenia", wypozyczenia);
app.use("/recenzje", recenzje);
app.use("/promocje", promocje);

if (klientApiWorkera) {
  app.use("/worker", utworzRouterWorkera({ klient: klientApiWorkera }));
}

app.use(obsluzBladRoutera);

app.listen(port, host, () => {
  console.log(`Przykladowa apka na porcie ${port}`);
});
