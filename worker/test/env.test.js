import assert from "node:assert/strict";
import test from "node:test";
import { getConfig } from "../src/config/env.js";

const TEST_ENV = {
  BACKEND_API_URL: "http://localhost:3000",
  BACKEND_API_AUTHORIZED_KEY: "wypo_test",
  BACKEND_REQUEST_TIMEOUT_MS: "10000",
  WORKER_API_KEY: "worker-test-key",
  WORKER_API_HOST: "127.0.0.1",
  WORKER_API_PORT: "3001",
  WORKER_DATABASE_URL: "postgresql://worker:password@localhost:5432/worker",
  CRON_DAILY_PROMOTION: "0 3 * * *",
  TZ: "Europe/Warsaw",
  PROMOTION_DISCOUNT_MIN_PERCENT: "10",
  PROMOTION_DISCOUNT_MAX_PERCENT: "20"
};

function zTestowymEnv(callback) {
  const nazwy = [...Object.keys(TEST_ENV), "DAILY_PROMOTION_ENABLED"];
  const poprzednie = Object.fromEntries(
    nazwy.map((nazwa) => [nazwa, process.env[nazwa]])
  );

  Object.assign(process.env, TEST_ENV);

  try {
    callback();
  } finally {
    for (const [nazwa, wartosc] of Object.entries(poprzednie)) {
      if (wartosc === undefined) {
        delete process.env[nazwa];
      } else {
        process.env[nazwa] = wartosc;
      }
    }
  }
}

test("DAILY_PROMOTION_ENABLED steruje harmonogramem i domyslnie jest true", () => {
  zTestowymEnv(() => {
    delete process.env.DAILY_PROMOTION_ENABLED;
    assert.equal(getConfig().dailyPromotionEnabled, true);

    process.env.DAILY_PROMOTION_ENABLED = "false";
    assert.equal(getConfig().dailyPromotionEnabled, false);

    process.env.DAILY_PROMOTION_ENABLED = " TRUE ";
    assert.equal(getConfig().dailyPromotionEnabled, true);

    process.env.DAILY_PROMOTION_ENABLED = "yes";
    assert.throws(
      () => getConfig(),
      /DAILY_PROMOTION_ENABLED musi miec wartosc true albo false/
    );
  });
});
