import cron from "node-cron";

export const SETTING_KEYS = Object.freeze([
  "cron_daily_promotion",
  "timezone",
  "discount_min_percent",
  "discount_max_percent"
]);

export class WorkerSettingsValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkerSettingsValidationError";
  }
}

function parseDiscount(value, key) {
  const normalized = String(value).trim();
  const parsed = Number(normalized);

  if (!/^\d+$/.test(normalized) || !Number.isInteger(parsed)) {
    throw new WorkerSettingsValidationError(
      `Ustawienie ${key} musi byc liczba calkowita.`
    );
  }

  if (parsed < 1 || parsed > 99) {
    throw new WorkerSettingsValidationError(
      `Ustawienie ${key} musi byc w zakresie 1-99.`
    );
  }

  return parsed;
}

function validateTimeZone(value) {
  const normalized = String(value).trim();

  try {
    new Intl.DateTimeFormat("pl-PL", { timeZone: normalized }).format();
  } catch {
    throw new WorkerSettingsValidationError(
      `Nieprawidlowa strefa czasowa: ${normalized}`
    );
  }

  return normalized;
}

export function parseWorkerSettings(rawSettings) {
  const cronDailyPromotion = String(
    rawSettings.cron_daily_promotion ?? ""
  ).trim();

  if (!cron.validate(cronDailyPromotion)) {
    throw new WorkerSettingsValidationError(
      `Nieprawidlowe ustawienie cron_daily_promotion: ${cronDailyPromotion}`
    );
  }

  const timeZone = validateTimeZone(rawSettings.timezone ?? "");
  const discountMinPercent = parseDiscount(
    rawSettings.discount_min_percent,
    "discount_min_percent"
  );
  const discountMaxPercent = parseDiscount(
    rawSettings.discount_max_percent,
    "discount_max_percent"
  );

  if (discountMinPercent > discountMaxPercent) {
    throw new WorkerSettingsValidationError(
      "discount_min_percent nie moze byc wieksze od discount_max_percent."
    );
  }

  return Object.freeze({
    cronDailyPromotion,
    timeZone,
    discountMinPercent,
    discountMaxPercent
  });
}

export async function initializeWorkerSettings(repository, defaultSettings) {
  await repository.initialize(defaultSettings);
  return loadWorkerSettings(repository);
}

export async function loadWorkerSettings(repository) {
  return parseWorkerSettings(await repository.getAll());
}

export async function updateWorkerSettings(repository, updates) {
  if (
    updates === null ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    throw new WorkerSettingsValidationError(
      "Ustawienia musza byc obiektem JSON."
    );
  }

  const entries = Object.entries(updates);

  if (entries.length === 0) {
    throw new WorkerSettingsValidationError(
      "Nalezy przekazac co najmniej jedno ustawienie."
    );
  }

  const unknownKeys = entries
    .map(([key]) => key)
    .filter((key) => !SETTING_KEYS.includes(key));

  if (unknownKeys.length > 0) {
    throw new WorkerSettingsValidationError(
      `Nieznane ustawienia: ${unknownKeys.join(", ")}. Dozwolone: ${SETTING_KEYS.join(", ")}.`
    );
  }

  const current = await repository.getAll();
  const candidate = { ...current };

  for (const [key, value] of entries) {
    candidate[key] = String(value).trim();
  }

  const parsedSettings = parseWorkerSettings(candidate);
  const normalizedSettings = Object.fromEntries(
    settingsToEntries(parsedSettings).map(([key, value]) => [
      key,
      String(value)
    ])
  );
  const changedEntries = entries.map(([key]) => [
    key,
    normalizedSettings[key]
  ]);

  await repository.setMany(changedEntries);

  return parsedSettings;
}

export async function updateWorkerSetting(repository, key, value) {
  return updateWorkerSettings(repository, { [key]: value });
}

export function settingsToEntries(settings) {
  return [
    ["cron_daily_promotion", settings.cronDailyPromotion],
    ["timezone", settings.timeZone],
    ["discount_min_percent", settings.discountMinPercent],
    ["discount_max_percent", settings.discountMaxPercent]
  ];
}
