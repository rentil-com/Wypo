export function obsluzBladRoutera(err, req, res, next) {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Body nie zawiera poprawnego JSON."
    });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Body JSON jest zbyt duze."
    });
  }

  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: "Blad serwera"
  });
}
