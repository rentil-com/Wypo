import { WorkerRepository } from "../database/worker-repository.js";
import { getHistoryConfig } from "../config/env.js";
import { initializeWorkerSettings } from "../services/worker-settings.js";

function formatValue(value) {
  return value === null || value === undefined ? "-" : String(value);
}

function printRun(run) {
  const createdAt = new Date(run.createdAt).toISOString();
  const details = [
    `id=${run.id}`,
    `status=${run.status}`,
    `item_id=${formatValue(run.itemId)}`,
    `item=${JSON.stringify(run.itemName ?? "")}`,
    `old_price=${formatValue(run.oldPrice)}`,
    `promotional_price=${formatValue(run.promotionalPrice)}`,
    `discount=${formatValue(run.discountPercent)}`,
    `deactivated_at=${run.deactivatedAt ? new Date(run.deactivatedAt).toISOString() : "-"}`,
    `error=${JSON.stringify(run.errorMessage ?? "")}`
  ];

  console.info(`[${createdAt}] ${details.join(" ")}`);
}

let repository;

try {
  const config = getHistoryConfig();
  const requestedLimit =
    process.argv[2] ?? String(config.historyDefaultLimit);
  const limit = Number(requestedLimit);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > config.historyMaxLimit
  ) {
    throw new Error(
      `Limit historii musi byc liczba calkowita od 1 do ${config.historyMaxLimit}.`
    );
  }

  repository = new WorkerRepository({
    connectionString: config.databaseUrl
  });
  await initializeWorkerSettings(repository, config.defaultSettings);
  const runs = await repository.getRecentPromotionRuns(limit);

  if (runs.length === 0) {
    console.info("[worker-history] Brak zapisanych wykonan promocji.");
  } else {
    runs.forEach(printRun);
  }
} catch (error) {
  console.error(
    `[worker-history] Blad: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
} finally {
  if (repository) {
    await repository.close();
  }
}
