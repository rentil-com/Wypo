import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BackendClient } from "../clients/backend-client.js";
import { getConfig } from "../config/env.js";
import { WorkerRepository } from "../database/worker-repository.js";
import { initializeWorkerSettings } from "../services/worker-settings.js";

function formatPrice(price) {
  return `${price.toFixed(2)} PLN`;
}

function getDiscountPercent(random, minPercent, maxPercent) {
  return (
    Math.floor(random() * (maxPercent - minPercent + 1)) + minPercent
  );
}

function calculatePromotionalPrice(price, discountPercent) {
  return Number((price * (1 - discountPercent / 100)).toFixed(2));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function saveErrorHistory({
  historyRepository,
  selectedItem,
  oldPrice,
  promotionalPrice,
  discountPercent,
  error,
  logger
}) {
  if (!historyRepository) {
    return;
  }

  try {
    await historyRepository.savePromotionRun({
      status: "error",
      itemId: selectedItem?.id ?? null,
      itemName: selectedItem?.nazwa ?? null,
      oldPrice: Number.isFinite(oldPrice) ? oldPrice : null,
      promotionalPrice:
        Number.isFinite(promotionalPrice) ? promotionalPrice : null,
      discountPercent:
        Number.isInteger(discountPercent) ? discountPercent : null,
      errorMessage: getErrorMessage(error)
    });
  } catch (historyError) {
    logger.error(
      `[daily-promotion] Nie udalo sie zapisac bledu w historii: ${getErrorMessage(historyError)}`
    );
  }
}

async function deactivateExistingPromotions({
  client,
  historyRepository,
  logger
}) {
  const promotionalItems = await client.getPromotionalItems();

  for (const item of promotionalItems) {
    await client.clearPromotionalPrice(item.id);
    logger.info(
      `[daily-promotion] Dezaktywowano stara promocje: id=${item.id}, nazwa=${JSON.stringify(item.nazwa ?? "")}`
    );
  }

  if (historyRepository) {
    await historyRepository.deactivateActivePromotionRuns();
  }
}

export async function runDailyPromotion({
  client,
  historyRepository = null,
  discountMinPercent,
  discountMaxPercent,
  random = Math.random,
  logger = console
}) {
  if (
    !Number.isInteger(discountMinPercent) ||
    !Number.isInteger(discountMaxPercent) ||
    discountMinPercent < 1 ||
    discountMaxPercent > 99 ||
    discountMinPercent > discountMaxPercent
  ) {
    throw new Error("Nieprawidlowy zakres rabatu promocji.");
  }

  let selectedItem = null;
  let oldPrice = null;
  let discountPercent = null;
  let promotionalPrice = null;
  let outcome;

  try {
    await deactivateExistingPromotions({
      client,
      historyRepository,
      logger
    });

    const items = await client.getAvailableItems();

    if (items.length === 0) {
      logger.warn(
        "[daily-promotion] Brak dostepnych przedmiotow. Promocja nie zostala ustawiona."
      );
      outcome = { status: "skipped" };
    } else {
      selectedItem = items[Math.floor(random() * items.length)];

      logger.info(
        `[daily-promotion] Wybrany przedmiot: id=${selectedItem.id}, nazwa=${JSON.stringify(selectedItem.nazwa ?? "")}`
      );

      const rawOldPrice = selectedItem.cena;

      if (
        rawOldPrice === null ||
        rawOldPrice === undefined ||
        String(rawOldPrice).trim() === ""
      ) {
        throw new Error(
          `[daily-promotion] Brak ceny dla przedmiotu id=${selectedItem.id}.`
        );
      }

      oldPrice = Number(rawOldPrice);

      if (!Number.isFinite(oldPrice) || oldPrice < 0) {
        throw new Error(
          `[daily-promotion] Brak poprawnej ceny dla przedmiotu id=${selectedItem.id}.`
        );
      }

      discountPercent = getDiscountPercent(
        random,
        discountMinPercent,
        discountMaxPercent
      );
      promotionalPrice = calculatePromotionalPrice(
        oldPrice,
        discountPercent
      );

      logger.info(`[daily-promotion] Stara cena: ${formatPrice(oldPrice)}`);
      logger.info(`[daily-promotion] Rabat: ${discountPercent}%`);
      logger.info(
        `[daily-promotion] Nowa cena promocyjna: ${formatPrice(promotionalPrice)}`
      );

      await client.updatePromotionalPrice(
        selectedItem.id,
        promotionalPrice
      );

      logger.info(
        `[daily-promotion] Zaktualizowano cene promocyjna przedmiotu id=${selectedItem.id}.`
      );

      outcome = {
        status: "success",
        itemId: selectedItem.id,
        itemName: selectedItem.nazwa ?? null,
        oldPrice,
        promotionalPrice,
        discountPercent
      };
    }
  } catch (error) {
    await saveErrorHistory({
      historyRepository,
      selectedItem,
      oldPrice,
      promotionalPrice,
      discountPercent,
      error,
      logger
    });
    throw error;
  }

  if (historyRepository) {
    await historyRepository.savePromotionRun(outcome);
  }

  if (outcome.status === "skipped") {
    return null;
  }

  return {
    item: selectedItem,
    oldPrice,
    discountPercent,
    promotionalPrice
  };
}

export function logPromotionError(error, logger = console) {
  logger.error(`[daily-promotion] Blad: ${getErrorMessage(error)}`);
}

async function main() {
  let repository;

  try {
    const config = getConfig();
    repository = new WorkerRepository({
      connectionString: config.databaseUrl
    });
    const settings = await initializeWorkerSettings(
      repository,
      config.defaultSettings
    );
    const client = new BackendClient({
      baseUrl: config.backendApiUrl,
      apiKey: config.backendApiAuthorizedKey,
      timeoutMs: config.requestTimeoutMs
    });

    await runDailyPromotion({
      client,
      historyRepository: repository,
      discountMinPercent: settings.discountMinPercent,
      discountMaxPercent: settings.discountMaxPercent
    });
  } catch (error) {
    logPromotionError(error);
    process.exitCode = 1;
  } finally {
    if (repository) {
      await repository.close();
    }
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  await main();
}
