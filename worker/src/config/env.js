import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));

dotenv.config({ path: envPath, quiet: true });

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Brak wymaganej zmiennej srodowiskowej: ${name}`);
  }

  return value;
}

function getRequiredIntegerEnv(name, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const rawValue = getRequiredEnv(name);

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} musi byc liczba calkowita.`);
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} musi byc w zakresie ${min}-${max}.`);
  }

  return value;
}

function getOptionalIntegerEnv(
  name,
  defaultValue,
  { min = 1, max = Number.MAX_SAFE_INTEGER } = {}
) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} musi byc liczba calkowita.`);
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} musi byc w zakresie ${min}-${max}.`);
  }

  return value;
}

function getBackendApiUrl() {
  const value = getRequiredEnv("BACKEND_API_URL");
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("BACKEND_API_URL musi byc poprawnym adresem URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("BACKEND_API_URL musi uzywac protokolu HTTP lub HTTPS.");
  }

  return value.replace(/\/+$/, "");
}

function getTimeZone() {
  const value = getRequiredEnv("TZ");

  try {
    new Intl.DateTimeFormat("pl-PL", { timeZone: value }).format();
  } catch {
    throw new Error(`Nieprawidlowa strefa czasowa TZ: ${value}`);
  }

  return value;
}

function getDefaultSettings() {
  const discountMinPercent = getRequiredIntegerEnv(
    "PROMOTION_DISCOUNT_MIN_PERCENT",
    { min: 1, max: 99 }
  );
  const discountMaxPercent = getRequiredIntegerEnv(
    "PROMOTION_DISCOUNT_MAX_PERCENT",
    { min: 1, max: 99 }
  );

  if (discountMinPercent > discountMaxPercent) {
    throw new Error(
      "PROMOTION_DISCOUNT_MIN_PERCENT nie moze byc wieksze od PROMOTION_DISCOUNT_MAX_PERCENT."
    );
  }

  return Object.freeze({
    cron_daily_promotion: getRequiredEnv("CRON_DAILY_PROMOTION"),
    timezone: getTimeZone(),
    discount_min_percent: String(discountMinPercent),
    discount_max_percent: String(discountMaxPercent)
  });
}

export function getSettingsConfig() {
  return Object.freeze({
    databaseUrl: getRequiredEnv("WORKER_DATABASE_URL"),
    defaultSettings: getDefaultSettings()
  });
}

export function getHistoryConfig() {
  const settingsConfig = getSettingsConfig();
  const historyDefaultLimit = getRequiredIntegerEnv(
    "HISTORY_DEFAULT_LIMIT"
  );
  const historyMaxLimit = getRequiredIntegerEnv("HISTORY_MAX_LIMIT");

  if (historyDefaultLimit > historyMaxLimit) {
    throw new Error(
      "HISTORY_DEFAULT_LIMIT nie moze byc wieksze od HISTORY_MAX_LIMIT."
    );
  }

  return Object.freeze({
    ...settingsConfig,
    historyDefaultLimit,
    historyMaxLimit
  });
}

export function getConfig() {
  const settingsConfig = getSettingsConfig();

  return Object.freeze({
    ...settingsConfig,
    backendApiUrl: getBackendApiUrl(),
    backendApiAuthorizedKey: getRequiredEnv("BACKEND_API_AUTHORIZED_KEY"),
    workerApiKey: getRequiredEnv("WORKER_API_KEY"),
    workerApiHost: process.env.WORKER_API_HOST?.trim() || "0.0.0.0",
    workerApiPort: getOptionalIntegerEnv("WORKER_API_PORT", 3001, {
      min: 1,
      max: 65535
    }),
    requestTimeoutMs: getRequiredIntegerEnv(
      "BACKEND_REQUEST_TIMEOUT_MS"
    )
  });
}
