import { pobierzUzytkownikaZSesji } from "../services/sessions.js";
import { pobierzAdminaZKluczaApi } from "../services/klucze-api.js";

export async function dolaczUzytkownikaZSesji(req, res, next) {
  try {
    if (!Object.prototype.hasOwnProperty.call(req, "uzytkownik")) {
      const uwierzytelnienieApi = await pobierzAdminaZKluczaApi(req);

      req.uzytkownik = uwierzytelnienieApi.przekazany
        ? uwierzytelnienieApi.uzytkownik
        : await pobierzUzytkownikaZSesji(req);
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

export function wymagajZalogowania(req, res, next) {
  if (!req.uzytkownik) {
    return res.status(401).json({
      error: "Wymagane logowanie."
    });
  }

  return next();
}

export function tylkoAdmin(req, res, next) {
  if (req.uzytkownik?.rola !== "admin") {
    return res.status(403).json({
      error: "Brak uprawnien."
    });
  }

  return next();
}
