import { WorkerRepository } from "../database/worker-repository.js";
import { getSettingsConfig } from "../config/env.js";
import {
  initializeWorkerSettings,
  settingsToEntries,
  updateWorkerSetting
} from "../services/worker-settings.js";

function printSettings(settings) {
  for (const [key, value] of settingsToEntries(settings)) {
    console.info(`${key}=${value}`);
  }
}

function printUsage() {
  console.info("Uzycie:");
  console.info("  npm run settings:list");
  console.info("  npm run settings:set -- <klucz> <wartosc>");
}

async function main() {
  const [command, key, ...valueParts] = process.argv.slice(2);
  const config = getSettingsConfig();
  const repository = new WorkerRepository({
    connectionString: config.databaseUrl
  });

  try {
    let settings = await initializeWorkerSettings(
      repository,
      config.defaultSettings
    );

    if (command === "list") {
      printSettings(settings);
      return;
    }

    if (command === "set") {
      const value = valueParts.join(" ").trim();

      if (!key || !value) {
        printUsage();
        throw new Error("Brak klucza lub wartosci ustawienia.");
      }

      settings = await updateWorkerSetting(repository, key, value);
      console.info(`[worker-settings] Zapisano ${key}=${value}`);
      printSettings(settings);
      return;
    }

    printUsage();
    throw new Error(`Nieznana komenda: ${command ?? ""}`);
  } finally {
    await repository.close();
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `[worker-settings] Blad: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
