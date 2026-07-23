import assert from "node:assert/strict";
import test from "node:test";
import { runDailyPromotion } from "../src/jobs/daily-promotion.js";

function createLogger() {
  const warnings = [];

  return {
    warnings,
    info() {},
    warn(message) {
      warnings.push(message);
    },
    error() {}
  };
}

function createHistoryRepository({
  activeRuns = [],
  lastPromotedItemId = null
} = {}) {
  const deactivatedRunIds = [];
  const savedRuns = [];

  return {
    deactivatedRunIds,
    savedRuns,
    async getActivePromotionRuns() {
      return activeRuns;
    },
    async deactivatePromotionRun(id) {
      deactivatedRunIds.push(id);
      return true;
    },
    async getLastSuccessfullyPromotedItemId() {
      return lastPromotedItemId;
    },
    async savePromotionRun(run) {
      savedRuns.push(run);
      return run;
    }
  };
}

test("dezaktywuje poprzednia promocje backendu i tworzy nowa", async () => {
  const deactivatedPromotionIds = [];
  const createdPromotions = [];
  const historyRepository = createHistoryRepository({
    activeRuns: [
      {
        id: 10,
        itemId: 1,
        itemName: "Wiertarka",
        backendPromotionId: 31,
        promotionalPrice: 80
      }
    ],
    lastPromotedItemId: 1
  });
  const client = {
    async deactivatePromotion(id) {
      deactivatedPromotionIds.push(id);
    },
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, czy_promocja: false },
        { id: 2, nazwa: "Mlotek", cena: 100, czy_promocja: false },
        { id: 3, nazwa: "Pilarka", cena: 100, czy_promocja: true }
      ];
    },
    async createPromotion(promotion) {
      createdPromotions.push(promotion);
      return { id: 32 };
    }
  };

  const result = await runDailyPromotion({
    client,
    historyRepository,
    discountMinPercent: 10,
    discountMaxPercent: 10,
    random: () => 0,
    logger: createLogger()
  });

  assert.deepEqual(deactivatedPromotionIds, [31]);
  assert.deepEqual(historyRepository.deactivatedRunIds, [10]);
  assert.deepEqual(createdPromotions[0].zakres_sprzetow.sprzety_ids, [2]);
  assert.equal(createdPromotions[0].typ, "procentowa");
  assert.equal(createdPromotions[0].wartosc, 10);
  assert.equal(result.item.id, 2);
  assert.equal(result.backendPromotionId, 32);
  assert.equal(historyRepository.savedRuns.at(-1).backendPromotionId, 32);
  assert.equal(historyRepository.savedRuns.at(-1).status, "success");
});

test("zamyka stary wpis historii bez ID promocji backendu", async () => {
  const deactivatedPromotionIds = [];
  const createdPromotions = [];
  const logger = createLogger();
  const historyRepository = createHistoryRepository({
    activeRuns: [
      {
        id: 20,
        itemId: 1,
        itemName: "Wiertarka",
        promotionalPrice: 80
      }
    ],
    lastPromotedItemId: 1
  });
  const client = {
    async deactivatePromotion(id) {
      deactivatedPromotionIds.push(id);
    },
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, czy_promocja: false },
        { id: 2, nazwa: "Mlotek", cena: 50, czy_promocja: false }
      ];
    },
    async createPromotion(promotion) {
      createdPromotions.push(promotion);
      return { id: 41 };
    }
  };

  await runDailyPromotion({
    client,
    historyRepository,
    discountMinPercent: 20,
    discountMaxPercent: 20,
    random: () => 0,
    logger
  });

  assert.deepEqual(deactivatedPromotionIds, []);
  assert.deepEqual(historyRepository.deactivatedRunIds, [20]);
  assert.deepEqual(createdPromotions[0].zakres_sprzetow.sprzety_ids, [2]);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0], /nie ma identyfikatora promocji backendu/);
});

test("pozwala ponownie promowac przedmiot, jezeli nie byl promowany ostatnio", async () => {
  const createdPromotions = [];
  const historyRepository = createHistoryRepository({
    lastPromotedItemId: 2
  });
  const client = {
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, czy_promocja: false },
        { id: 2, nazwa: "Mlotek", cena: 50, czy_promocja: false }
      ];
    },
    async createPromotion(promotion) {
      createdPromotions.push(promotion);
      return { id: 51 };
    }
  };

  const result = await runDailyPromotion({
    client,
    historyRepository,
    discountMinPercent: 10,
    discountMaxPercent: 20,
    random: () => 0,
    logger: createLogger()
  });

  assert.equal(result.item.id, 1);
  assert.deepEqual(createdPromotions[0].zakres_sprzetow.sprzety_ids, [1]);
  assert.equal(historyRepository.savedRuns.at(-1).status, "success");
});

test("nie promuje tego samego przedmiotu dwa razy pod rzad", async () => {
  const createdPromotions = [];
  const historyRepository = createHistoryRepository({
    lastPromotedItemId: 1
  });
  const client = {
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, czy_promocja: false }
      ];
    },
    async createPromotion(promotion) {
      createdPromotions.push(promotion);
      return { id: 61 };
    }
  };

  const result = await runDailyPromotion({
    client,
    historyRepository,
    discountMinPercent: 10,
    discountMaxPercent: 20,
    random: () => 0,
    logger: createLogger()
  });

  assert.equal(result, null);
  assert.deepEqual(createdPromotions, []);
  assert.deepEqual(historyRepository.savedRuns, [{ status: "skipped" }]);
});
