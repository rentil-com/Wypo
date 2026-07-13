import multer from "multer";
import { pobierzDodatniaLiczbeCalkowitaEnv } from "../helpers/env.js";

const UPLOAD_MAX_FILE_SIZE_BYTES = pobierzDodatniaLiczbeCalkowitaEnv(
  "UPLOAD_MAX_FILE_SIZE_BYTES",
  5 * 1024 * 1024
);
const UPLOAD_MAX_PHOTOS = pobierzDodatniaLiczbeCalkowitaEnv(
  "UPLOAD_MAX_PHOTOS",
  10
);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_MAX_FILE_SIZE_BYTES
  }
});

export const uploadDodawanieSprzetu = upload.fields([
  { name: "zdjecia", maxCount: UPLOAD_MAX_PHOTOS },
  { name: "zdjecie", maxCount: 1 }
]);

export const uploadDodawanieZdjec = upload.fields([
  { name: "zdjecie", maxCount: UPLOAD_MAX_PHOTOS },
  { name: "zdjecia", maxCount: UPLOAD_MAX_PHOTOS }
]);

export function parsujEdycjeBezZdjec(req, res, next) {
  upload.none()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: "Zdjecia sprzetu mozna zmieniac tylko przez add_photos albo delete_photos."
      });
    }

    return next();
  });
}

export const uploadPojedynczegoZdjecia = upload.single("zdjecie");
