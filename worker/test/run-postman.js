import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import newman from "newman";
import {
  closeWorkerApi,
  createWorkerApiServer,
  listenWorkerApi
} from "../src/api/worker-api.js";

const API_KEY = "postman-test-worker-key";
const collectionPath = fileURLToPath(
  new URL("../postman/Worker-API.postman_collection.json", import.meta.url)
);
const environmentPath = fileURLToPath(
  new URL("../postman/Worker-local.postman_environment.json", import.meta.url)
);

function runCollection(options) {
  return new Promise((resolve, reject) => {
    newman.run(options, (error, summary) => {
      if (error) {
        reject(error);
        return;
      }

      const failures = summary.run.failures ?? [];

      if (failures.length > 0) {
        reject(
          new Error(
            failures
              .map((failure) => failure.error?.message ?? String(failure))
              .join("\n")
          )
        );
        return;
      }

      resolve(summary);
    });
  });
}

const rawSettings = {
  cron_daily_promotion: "0 3 * * *",
  timezone: "Europe/Warsaw",
  discount_min_percent: "10",
  discount_max_percent: "20"
};
const repository = {
  async getAll() {
    return { ...rawSettings };
  },
  async setMany(entries) {
    for (const [key, value] of entries) {
      rawSettings[key] = String(value);
    }
  }
};
let runPromotionCalls = 0;
const server = createWorkerApiServer({
  repository,
  apiKey: API_KEY,
  async runPromotion() {
    runPromotionCalls += 1;
    return {
      status: "success",
      promotion: {
        item: { id: 77, nazwa: "Postman test item" },
        oldPrice: 100,
        discountPercent: 20,
        promotionalPrice: 80
      }
    };
  }
});

try {
  await listenWorkerApi(server, { host: "127.0.0.1", port: 0 });
  const address = server.address();
  const environment = JSON.parse(
    await readFile(environmentPath, "utf8")
  );

  for (const variable of environment.values) {
    if (variable.key === "worker_base_url") {
      variable.value = "http://127.0.0.1:" + address.port;
    }

    if (variable.key === "worker_api_key") {
      variable.value = API_KEY;
    }
  }

  await runCollection({
    collection: collectionPath,
    environment,
    reporters: ["cli"],
    color: "off",
    timeoutRequest: 5000
  });
  assert.equal(
    runPromotionCalls,
    1,
    "Postman powinien uruchomic promocje dokladnie jeden raz."
  );
} finally {
  await closeWorkerApi(server);
}
