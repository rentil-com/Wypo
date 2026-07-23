import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "../db/pool.js";
import edytujRouter from "../routes/endpoints/wypozyczenia/edytuj.js";

async function zRouterem(callback) {
  const app = express();

  app.use(express.json());
  app.use("/wypozyczenia/edytuj", edytujRouter);

  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

async function sprawdzNiezmiennePole(body) {
  const poprzednieConnect = pool.connect;
  let liczbaPolaczen = 0;

  pool.connect = async () => {
    liczbaPolaczen += 1;
    throw new Error("Baza nie powinna byc wywolywana dla niedozwolonego pola.");
  };

  try {
    await zRouterem(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/wypozyczenia/edytuj/4`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const odpowiedz = await response.json();

      assert.equal(response.status, 400);
      assert.match(odpowiedz.error, /nie mozna zmienic sprzetu ani uzytkownika/i);
    });

    assert.equal(liczbaPolaczen, 0);
  } finally {
    pool.connect = poprzednieConnect;
  }
}

test("nie pozwala zmienic sprzetu istniejacego wypozyczenia", async () => {
  await sprawdzNiezmiennePole({
    sprzet_id: 99,
    status: "oczekujacy"
  });
});

test("nie pozwala zmienic uzytkownika istniejacego wypozyczenia", async () => {
  await sprawdzNiezmiennePole({
    uzytkownik_id: 77,
    status: "oczekujacy"
  });
});
