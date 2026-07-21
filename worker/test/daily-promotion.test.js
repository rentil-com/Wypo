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

function createHistoryRepository({ activeRuns = [], promotedItemIds = [] }) {
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
    async getSuccessfullyPromotedItemIds() {
      return promotedItemIds;
    },
    async savePromotionRun(run) {
      savedRuns.push(run);
      return run;
    }
  };
}

test("dezaktywuje tylko niezmieniona promocje ustawiona przez workera", async () => {
  const clearedItemIds = [];
  const updatedPromotions = [];
  const historyRepository = createHistoryRepository({
    activeRuns: [
      {
        id: 10,
        itemId: 1,
        itemName: "Wiertarka",
        promotionalPrice: 80
      }
    ],
    promotedItemIds: [1]
  });
  const client = {
    async getItem(id) {
      assert.equal(id, 1);
      return { id, cena_po_promocji: "80.00" };
    },
    async clearPromotionalPrice(id) {
      clearedItemIds.push(id);
    },
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, cena_po_promocji: null },
        { id: 2, nazwa: "Mlotek", cena: 100, cena_po_promocji: null },
        { id: 3, nazwa: "Pilarka", cena: 100, cena_po_promocji: 70 }
      ];
    },
    async updatePromotionalPrice(id, price) {
      updatedPromotions.push({ id, price });
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

  assert.deepEqual(clearedItemIds, [1]);
  assert.deepEqual(historyRepository.deactivatedRunIds, [10]);
  assert.deepEqual(updatedPromotions, [{ id: 2, price: 90 }]);
  assert.equal(result.item.id, 2);
  assert.equal(historyRepository.savedRuns.at(-1).status, "success");
});

test("nie usuwa promocji zmienionej poza workerem i zapisuje ostrzezenie", async () => {
  const clearedItemIds = [];
  const updatedPromotions = [];
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
    promotedItemIds: [1]
  });
  const client = {
    async getItem() {
      return { id: 1, cena_po_promocji: 75 };
    },
    async clearPromotionalPrice(id) {
      clearedItemIds.push(id);
    },
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, cena_po_promocji: 75 },
        { id: 2, nazwa: "Mlotek", cena: 50, cena_po_promocji: null }
      ];
    },
    async updatePromotionalPrice(id, price) {
      updatedPromotions.push({ id, price });
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

  assert.deepEqual(clearedItemIds, []);
  assert.deepEqual(historyRepository.deactivatedRunIds, [20]);
  assert.deepEqual(updatedPromotions, [{ id: 2, price: 40 }]);
  assert.equal(logger.warnings.length, 1);
  assert.match(logger.warnings[0], /zmieniona poza workerem/);
});

test("pomija wykonanie, gdy wszystkie dostepne przedmioty byly juz promowane", async () => {
  const updatedPromotions = [];
  const historyRepository = createHistoryRepository({
    promotedItemIds: [1, 2]
  });
  const client = {
    async getAvailableItems() {
      return [
        { id: 1, nazwa: "Wiertarka", cena: 100, cena_po_promocji: null },
        { id: 2, nazwa: "Mlotek", cena: 50, cena_po_promocji: null }
      ];
    },
    async updatePromotionalPrice(id, price) {
      updatedPromotions.push({ id, price });
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
  assert.deepEqual(updatedPromotions, []);
  assert.deepEqual(historyRepository.savedRuns, [{ status: "skipped" }]);
});
