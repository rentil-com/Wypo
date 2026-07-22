import { WorkerRepository } from "../database/worker-repository.js";
import { getSettingsConfig } from "../config/env.js";
import {
  initializeWorkerSettings,
  settingsToEntries
} from "../services/worker-settings.js";

let repository;

try {
  const config = getSettingsConfig();
  repository = new WorkerRepository({
    connectionString: config.databaseUrl
  });
  const settings = await initializeWorkerSettings(
    repository,
    config.defaultSettings
  );

  console.info(
    "[worker-db] Tabele worker_settings i worker_promotion_runs sa gotowe."
  );

  for (const [key, value] of settingsToEntries(settings)) {
    console.info(`[worker-db] ${key}=${value}`);
  }
} catch (error) {
  console.error(
    `[worker-db] Blad: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
} finally {
  if (repository) {
    await repository.close();
  }
}
