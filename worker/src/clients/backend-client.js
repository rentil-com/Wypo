export class BackendClientError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "BackendClientError";
    this.status = options.status;
  }
}

export class BackendClient {
  constructor({ baseUrl, apiKey, timeoutMs }) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
      throw new Error("timeoutMs musi byc dodatnia liczba calkowita.");
    }

    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${this.apiKey}`);

    try {
      const response = await fetch(
        `${this.baseUrl}/${path.replace(/^\/+/, "")}`,
        {
          ...options,
          headers,
          signal: controller.signal
        }
      );
      const responseText = await response.text();
      let responseBody = null;

      if (responseText) {
        try {
          responseBody = JSON.parse(responseText);
        } catch {
          throw new BackendClientError(
            `Backend zwrocil nieprawidlowy JSON (HTTP ${response.status}).`,
            { status: response.status }
          );
        }
      }

      if (!response.ok) {
        const details =
          responseBody?.error || responseBody?.message || response.statusText;

        throw new BackendClientError(
          `Zadanie do backendu nie powiodlo sie (HTTP ${response.status}): ${details}`,
          { status: response.status }
        );
      }

      return responseBody;
    } catch (error) {
      if (error instanceof BackendClientError) {
        throw error;
      }

      if (error.name === "AbortError") {
        throw new BackendClientError(
          `Przekroczono limit czasu zadania do backendu (${this.timeoutMs} ms).`,
          { cause: error }
        );
      }

      throw new BackendClientError(
        `Nie udalo sie polaczyc z backendem: ${error.message}`,
        { cause: error }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async getItems(query = {}) {
    const items = [];
    let page = 1;
    let pageCount = 1;

    do {
      const searchParams = new URLSearchParams({
        ...query,
        strona: String(page)
      });
      const response = await this.request(`/items?${searchParams}`);

      if (!response || !Array.isArray(response.dane)) {
        throw new BackendClientError(
          "Backend zwrocil nieprawidlowy format GET /items: brak tablicy dane."
        );
      }

      const responsePageCount = Number(response.liczbaStron);

      if (!Number.isInteger(responsePageCount) || responsePageCount < 0) {
        throw new BackendClientError(
          "Backend zwrocil nieprawidlowy format GET /items: bledna liczbaStron."
        );
      }

      items.push(...response.dane);
      pageCount = responsePageCount;
      page += 1;
    } while (page <= pageCount);

    return items;
  }

  async getAvailableItems() {
    const items = await this.getItems({ status: "dostepny" });
    return items.filter((item) => item?.status === "dostepny");
  }

  async getItem(itemId) {
    try {
      return await this.request(`/items/${encodeURIComponent(itemId)}`);
    } catch (error) {
      if (error instanceof BackendClientError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  createPromotion(promotion) {
    return this.request("/promocje", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(promotion)
    });
  }

  deactivatePromotion(promotionId) {
    return this.request(`/promocje/${encodeURIComponent(promotionId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aktywna: false
      })
    });
  }
}
