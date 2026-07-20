import cron from "node-cron";
import { BackendClient } from "./clients/backend-client.js";
import { logPromotionError, runDailyPromotion } from "./jobs/daily-promotion.js";
import { getConfig } from "./config/env.js";
import { WorkerRepository } from "./database/worker-repository.js";
import {
  initializeWorkerSettings,
  loadWorkerSettings
} from "./services/worker-settings.js";

async function main() {
  let repository;

  try {
    const config = getConfig();
    repository = new WorkerRepository({
      connectionString: config.databaseUrl
    });
    const initialSettings = await initializeWorkerSettings(
      repository,
      config.defaultSettings
    );
    const client = new BackendClient({
      baseUrl: config.backendApiUrl,
      apiKey: config.backendApiAuthorizedKey,
      timeoutMs: config.requestTimeoutMs
    });

    const task = cron.schedule(
      initialSettings.cronDailyPromotion,
      async () => {
        try {
          const currentSettings = await loadWorkerSettings(repository);

          await runDailyPromotion({
            client,
            historyRepository: repository,
            discountMinPercent: currentSettings.discountMinPercent,
            discountMaxPercent: currentSettings.discountMaxPercent
          });
        } catch (error) {
          logPromotionError(error);
        }
      },
      {
        timezone: initialSettings.timeZone,
        noOverlap: true
      }
    );

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      task.stop();
      await repository.close();
      process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    console.info(
      `[worker] Zaplanowano codzienna promocje: ${initialSettings.cronDailyPromotion} (${initialSettings.timeZone}).`
    );
  } catch (error) {
    logPromotionError(error);

    if (repository) {
      await repository.close().catch(() => {});
    }

    process.exitCode = 1;
  }
}

await main();
