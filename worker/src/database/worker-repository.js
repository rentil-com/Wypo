import { readFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;
const schemaUrls = [
  new URL("../../sql/001_create_worker_settings.sql", import.meta.url),
  new URL("../../sql/002_create_worker_promotion_runs.sql", import.meta.url)
];

function nullableNumber(value) {
  return value === null ? null : Number(value);
}

function mapPromotionRun(row) {
  return {
    id: Number(row.id),
    status: row.status,
    itemId: nullableNumber(row.item_id),
    itemName: row.item_name,
    oldPrice: nullableNumber(row.old_price),
    promotionalPrice: nullableNumber(row.promotional_price),
    discountPercent: nullableNumber(row.discount_percent),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    deactivatedAt: row.deactivated_at
  };
}

export class WorkerRepository {
  constructor({ connectionString }) {
    this.pool = new Pool({ connectionString });
  }

  async initialize(defaultSettings) {
    const schemaSqlList = await Promise.all(
      schemaUrls.map((schemaUrl) => readFile(schemaUrl, "utf8"))
    );
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const schemaSql of schemaSqlList) {
        await client.query(schemaSql);
      }

      for (const [key, value] of Object.entries(defaultSettings)) {
        await client.query(
          `
          INSERT INTO worker_settings (setting_key, setting_value)
          VALUES ($1, $2)
          ON CONFLICT (setting_key) DO NOTHING;
          `,
          [key, String(value)]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async getAll() {
    const result = await this.pool.query(
      `
      SELECT setting_key, setting_value, updated_at
      FROM worker_settings
      ORDER BY setting_key;
      `
    );

    return Object.fromEntries(
      result.rows.map((row) => [row.setting_key, row.setting_value])
    );
  }

  async set(key, value) {
    await this.pool.query(
      `
      INSERT INTO worker_settings (setting_key, setting_value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) DO UPDATE
      SET setting_value = EXCLUDED.setting_value,
          updated_at = CURRENT_TIMESTAMP;
      `,
      [key, String(value)]
    );
  }

  async savePromotionRun({
    status,
    itemId = null,
    itemName = null,
    oldPrice = null,
    promotionalPrice = null,
    discountPercent = null,
    errorMessage = null
  }) {
    const result = await this.pool.query(
      `
      INSERT INTO worker_promotion_runs (
        status,
        item_id,
        item_name,
        old_price,
        promotional_price,
        discount_percent,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [
        status,
        itemId,
        itemName,
        oldPrice,
        promotionalPrice,
        discountPercent,
        errorMessage
      ]
    );

    return mapPromotionRun(result.rows[0]);
  }

  async deactivateActivePromotionRuns() {
    const result = await this.pool.query(
      `
      UPDATE worker_promotion_runs
      SET deactivated_at = CURRENT_TIMESTAMP
      WHERE status = 'success'
        AND deactivated_at IS NULL
      RETURNING id;
      `
    );

    return result.rows.map((row) => Number(row.id));
  }

  async getRecentPromotionRuns(limit) {
    if (!Number.isSafeInteger(limit) || limit < 1) {
      throw new Error("Limit historii musi byc dodatnia liczba calkowita.");
    }

    const result = await this.pool.query(
      `
      SELECT *
      FROM worker_promotion_runs
      ORDER BY created_at DESC, id DESC
      LIMIT $1;
      `,
      [limit]
    );

    return result.rows.map(mapPromotionRun);
  }

  async close() {
    await this.pool.end();
  }
}
