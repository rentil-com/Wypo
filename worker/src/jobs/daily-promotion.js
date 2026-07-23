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

function getPromotionName(item) {
  const fallback = `sprzet ${item.id}`;
  const itemName = String(item.nazwa ?? fallback).trim() || fallback;
  return `Promocja dnia: ${itemName}`.slice(0, 100);
}

function buildPromotion(item, discountPercent) {
  return {
    nazwa: getPromotionName(item),
    opis: "Automatyczna promocja dnia utworzona przez worker.",
    typ: "procentowa",
    wartosc: discountPercent,
    aktywna: true,
    data_od: new Date().toISOString(),
    data_do: null,
    zakres_sprzetow: {
      wszystkie: false,
      kategorie_ids: [],
      sprzety_ids: [Number(item.id)]
    },
    zakres_uzytkownikow: {
      wszyscy: true,
      uzytkownicy_ids: []
    }
  };
}

async function saveErrorHistory({
  historyRepository,
  selectedItem,
  oldPrice,
  promotionalPrice,
  backendPromotionId,
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
      backendPromotionId,
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
    const backendPromotionId = Number(run.backendPromotionId);

    if (!Number.isSafeInteger(backendPromotionId) || backendPromotionId < 1) {
      await historyRepository.deactivatePromotionRun(run.id);
      logger.warn(
        `[daily-promotion] Wpis historii id=${run.id} nie ma identyfikatora promocji backendu. Oznaczono go jako nieaktywny bez zmiany backendu.`
      );
      continue;
    }

    try {
      await client.deactivatePromotion(backendPromotionId);
    } catch (error) {
      if (error?.status !== 404) {
        throw error;
      }

      logger.warn(
        `[daily-promotion] Promocja backendu id=${backendPromotionId} juz nie istnieje.`
      );
    }

    await historyRepository.deactivatePromotionRun(run.id);
    logger.info(
      `[daily-promotion] Dezaktywowano promocje workera: promocja_id=${backendPromotionId}, sprzet_id=${run.itemId}.`
    );
  }
}

async function getEligibleItems(items, historyRepository) {
  const lastPromotedItemId = historyRepository
    ? await historyRepository.getLastSuccessfullyPromotedItemId()
    : null;

  return items.filter((item) => {
    const itemId = Number(item?.id);

    return (
      Number.isSafeInteger(itemId) &&
      itemId > 0 &&
      item?.czy_promocja !== true &&
      (lastPromotedItemId === null ||
        String(item.id) !== String(lastPromotedItemId))
    );
  });
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
  let backendPromotionId = null;
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

      const promotion = await client.createPromotion(
        buildPromotion(selectedItem, discountPercent)
      );
      backendPromotionId = Number(promotion?.id);

      if (!Number.isSafeInteger(backendPromotionId) || backendPromotionId < 1) {
        throw new Error("Backend nie zwrocil ID utworzonej promocji.");
      }

      logger.info(
        `[daily-promotion] Utworzono promocje id=${backendPromotionId} dla przedmiotu id=${selectedItem.id}.`
      );

      outcome = {
        status: "success",
        itemId: selectedItem.id,
        itemName: selectedItem.nazwa ?? null,
        oldPrice,
        promotionalPrice,
        backendPromotionId,
        discountPercent
      };
    }
  } catch (error) {
    await saveErrorHistory({
      historyRepository,
      selectedItem,
      oldPrice,
      promotionalPrice,
      backendPromotionId,
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
    backendPromotionId,
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
