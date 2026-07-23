import { BladPromocji } from "../../../services/promocje.js";

export function odpowiedzBleduPromocji(err, res) {
  if (err instanceof BladPromocji) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === "23503" || err.code === "40001" || err.code === "40P01") {
    return res.status(409).json({
      error: "Dane promocji zmienily sie. Sprobuj ponownie."
    });
  }

  if (err.code === "23514" || err.code === "22P02") {
    return res.status(400).json({
      error: "Nieprawidlowe dane promocji."
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "Blad serwera"
  });
}

