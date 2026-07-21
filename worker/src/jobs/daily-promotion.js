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

function priceInCents(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const price = Number(value);
  return Number.isFinite(price) ? Math.round(price * 100) : null;
}

function hasExpectedPromotionalPrice(item, expectedPrice) {
  const expectedPriceInCents = priceInCents(expectedPrice);
  const currentPriceInCents = priceInCents(item?.cena_po_promocji);

  return (
    expectedPriceInCents !== null &&
    expectedPriceInCents === currentPriceInCents
  );
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
  if (!historyRepository) {
    return;
  }

  const activePromotionRuns =
    await historyRepository.getActivePromotionRuns();

  for (const run of activePromotionRuns) {
    if (run.itemId === null) {
      await historyRepository.deactivatePromotionRun(run.id);
      logger.warn(
        `[daily-promotion] Pominieto dezaktywacje wpisu id=${run.id}, poniewaz nie ma identyfikatora przedmiotu.`
      );
      continue;
    }

    const currentItem = await client.getItem(run.itemId);

    if (!hasExpectedPromotionalPrice(currentItem, run.promotionalPrice)) {
      await historyRepository.deactivatePromotionRun(run.id);
      logger.warn(
        `[daily-promotion] Promocja przedmiotu id=${run.itemId} zostala zmieniona poza workerem (oczekiwana cena=${JSON.stringify(run.promotionalPrice)}, aktualna=${JSON.stringify(currentItem?.cena_po_promocji ?? null)}). Worker jej nie zmienil.`
      );
      continue;
    }

    await client.clearPromotionalPrice(run.itemId);
    await historyRepository.deactivatePromotionRun(run.id);
    logger.info(
      `[daily-promotion] Dezaktywowano promocje workera: id=${run.itemId}, nazwa=${JSON.stringify(run.itemName ?? "")}`
    );
  }
}

async function getEligibleItems(items, historyRepository) {
  const successfullyPromotedItemIds = historyRepository
    ? await historyRepository.getSuccessfullyPromotedItemIds()
    : [];
  const promotedItemIds = new Set(
    successfullyPromotedItemIds.map((itemId) => String(itemId))
  );

  return items.filter(
    (item) =>
      item?.id !== null &&
      item?.id !== undefined &&
      item.cena_po_promocji == null &&
      !promotedItemIds.has(String(item.id))
  );
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
    const eligibleItems = await getEligibleItems(items, historyRepository);

    if (eligibleItems.length === 0) {
      logger.warn(
        "[daily-promotion] Brak przedmiotow kwalifikujacych sie do promocji. Promocja nie zostala ustawiona."
      );
      outcome = { status: "skipped" };
    } else {
      selectedItem =
        eligibleItems[Math.floor(random() * eligibleItems.length)];

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
