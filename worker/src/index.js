import cron from "node-cron";
import {
  closeWorkerApi,
  createWorkerApiServer,
  listenWorkerApi
} from "./api/worker-api.js";
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
  let apiServer;
  let promotionTask;

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
    let scheduleSignature;
    let promotionRunning = false;

    const executePromotion = async () => {
      if (promotionRunning) {
        return { status: "already_running" };
      }

      promotionRunning = true;

      try {
        const currentSettings = await loadWorkerSettings(repository);
        const promotion = await runDailyPromotion({
          client,
          historyRepository: repository,
          discountMinPercent: currentSettings.discountMinPercent,
          discountMaxPercent: currentSettings.discountMaxPercent
        });

        return {
          status: promotion ? "success" : "skipped",
          promotion
        };
      } finally {
        promotionRunning = false;
      }
    };

    const executeScheduledPromotion = async () => {
      try {
        const outcome = await executePromotion();

        if (outcome.status === "already_running") {
          console.warn(
            "[worker] Pominieto wykonanie, poniewaz poprzednie nadal trwa."
          );
        }
      } catch (error) {
        logPromotionError(error);
      }
    };

    const applySchedule = async (settings) => {
      const nextSignature =
        `${settings.cronDailyPromotion}\n${settings.timeZone}`;

      if (nextSignature === scheduleSignature) {
        return;
      }

      const nextTask = cron.schedule(
        settings.cronDailyPromotion,
        executeScheduledPromotion,
        {
          timezone: settings.timeZone,
          noOverlap: true
        }
      );
      const previousTask = promotionTask;

      promotionTask = nextTask;
      scheduleSignature = nextSignature;
      previousTask?.stop();
      previousTask?.destroy();

      console.info(
        `[worker] Zaplanowano codzienna promocje: ${settings.cronDailyPromotion} (${settings.timeZone}).`
      );
    };

    const onSettingsUpdated = config.dailyPromotionEnabled
      ? applySchedule
      : async () => {};

    if (config.dailyPromotionEnabled) {
      await applySchedule(initialSettings);
    } else {
      console.info(
        "[worker] Automatyczna codzienna promocja jest wylaczona."
      );
    }

    apiServer = createWorkerApiServer({
      repository,
      apiKey: config.workerApiKey,
      runPromotion: executePromotion,
      onSettingsUpdated
    });
    await listenWorkerApi(apiServer, {
      host: config.workerApiHost,
      port: config.workerApiPort
    });

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      promotionTask?.stop();
      promotionTask?.destroy();

      try {
        await closeWorkerApi(apiServer);
        await repository.close();
        process.exit(0);
      } catch (error) {
        logPromotionError(error);
        process.exit(1);
      }
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    console.info(
      `[worker-api] API ustawien nasluchuje na http://${config.workerApiHost}:${config.workerApiPort}.`
    );
  } catch (error) {
    logPromotionError(error);

    promotionTask?.stop();
    promotionTask?.destroy();
    await closeWorkerApi(apiServer).catch(() => {});

    if (repository) {
      await repository.close().catch(() => {});
    }

    process.exitCode = 1;
  }
}

await main();
