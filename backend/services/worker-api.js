const DOMYSLNY_TIMEOUT_MS = 10000;

export class BladApiWorkera extends Error {
  constructor(
    message,
    {
      kodOdpowiedzi = 502,
      kodHttpWorkera = null,
      odpowiedzWorkera = null,
      cause
    } = {}
  ) {
    super(message, { cause });
    this.name = "BladApiWorkera";
    this.kodOdpowiedzi = kodOdpowiedzi;
    this.kodHttpWorkera = kodHttpWorkera;
    this.odpowiedzWorkera = odpowiedzWorkera;
  }
}

function normalizujBazowyUrl(wartosc) {
  let url;

  try {
    url = new URL(wartosc);
  } catch {
    throw new Error("WORKER_API_URL musi byc poprawnym adresem URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("WORKER_API_URL musi uzywac protokolu HTTP lub HTTPS.");
  }

  if (url.search || url.hash) {
    throw new Error("WORKER_API_URL nie moze zawierac query string ani fragmentu.");
  }

  return url.toString().replace(/\/+$/, "");
}

function parsujTimeout(wartosc) {
  if (wartosc === undefined || String(wartosc).trim() === "") {
    return DOMYSLNY_TIMEOUT_MS;
  }

  const timeoutMs = Number(wartosc);

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error(
      "WORKER_API_REQUEST_TIMEOUT_MS musi byc dodatnia liczba calkowita."
    );
  }

  return timeoutMs;
}

export class KlientApiWorkera {
  constructor({ baseUrl, apiKey, timeoutMs, fetchImpl = fetch }) {
    if (typeof apiKey !== "string" || apiKey.trim() === "") {
      throw new Error("Brak wymaganej zmiennej srodowiskowej: WORKER_API_KEY");
    }

    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
      throw new Error("timeoutMs musi byc dodatnia liczba calkowita.");
    }

    if (typeof fetchImpl !== "function") {
      throw new Error("fetchImpl musi byc funkcja.");
    }

    this.baseUrl = normalizujBazowyUrl(baseUrl);
    this.apiKey = apiKey.trim();
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${this.apiKey}`);

    try {
      const response = await this.fetchImpl(
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
        } catch (error) {
          throw new BladApiWorkera(
            `Worker zwrocil nieprawidlowy JSON (HTTP ${response.status}).`,
            {
              kodHttpWorkera: response.status,
              cause: error
            }
          );
        }
      }

      if (!response.ok) {
        throw new BladApiWorkera(
          `Zadanie do workera nie powiodlo sie (HTTP ${response.status}).`,
          {
            kodHttpWorkera: response.status,
            odpowiedzWorkera: responseBody
          }
        );
      }

      if (responseBody === null) {
        throw new BladApiWorkera(
          `Worker zwrocil pusta odpowiedz (HTTP ${response.status}).`,
          { kodHttpWorkera: response.status }
        );
      }

      return responseBody;
    } catch (error) {
      if (error instanceof BladApiWorkera) {
        throw error;
      }

      if (error?.name === "AbortError") {
        throw new BladApiWorkera(
          `Przekroczono limit czasu zadania do workera (${this.timeoutMs} ms).`,
          {
            kodOdpowiedzi: 504,
            cause: error
          }
        );
      }

      throw new BladApiWorkera(
        `Nie udalo sie polaczyc z workerem: ${error.message}`,
        { cause: error }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  pobierzUstawienia() {
    return this.request("/settings");
  }

  zaktualizujUstawienia(ustawienia) {
    return this.request("/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(ustawienia)
    });
  }

  uruchomPromocje() {
    return this.request("/runpromotion", { method: "POST" });
  }
}

export function utworzKlientaApiWorkeraZEnv(env = process.env) {
  const baseUrl = env.WORKER_API_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  return new KlientApiWorkera({
    baseUrl,
    apiKey: env.WORKER_API_KEY,
    timeoutMs: parsujTimeout(env.WORKER_API_REQUEST_TIMEOUT_MS)
  });
}
