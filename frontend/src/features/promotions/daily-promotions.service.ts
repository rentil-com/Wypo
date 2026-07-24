import { ApiError, apiPost } from "@/services/api";
import type {
  DailyPromotionResponse,
  DailyPromotionResult,
} from "./daily-promotions.types";

export function czyOdpowiedzDziennejPromocji(
  value: unknown,
): value is DailyPromotionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<DailyPromotionResponse>;
  const promotion = response.promocja;
  const scope = promotion?.zakres_sprzetow;


  return Boolean(
    promotion &&
      typeof promotion.id === "number" &&
      promotion.typ === "procentowa" &&
      typeof promotion.wartosc === "number" &&
      typeof promotion.data_od === "string" &&
      typeof promotion.data_do === "string" &&
      scope &&
      scope.wszystkie === false &&
      Array.isArray(scope.kategorie_ids) &&
      scope.kategorie_ids.length === 0 &&
      Array.isArray(scope.sprzety_ids) &&
      scope.sprzety_ids.length === 1 &&
      typeof scope.sprzety_ids[0] === "number" &&
      typeof response.ponowne_losowanie_od === "string",
  );
}

export async function losujDziennaPromocje(): Promise<DailyPromotionResult> {
  try {
    const response = await apiPost("/promocje/losuj-dzienna-promocje");

    if (!czyOdpowiedzDziennejPromocji(response)) {
      throw new Error("Nieprawidlowa odpowiedz serwera");
    }

    return {
      ...response,
      utworzona: true,
    };
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      czyOdpowiedzDziennejPromocji(error.data)
    ) {
      return {
        ...error.data,
        utworzona: false,
      };
    }

    throw error;
  }
}
