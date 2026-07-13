import crypto from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { uporzadkujZdjeciaUrl } from "../helpers/images.js";

const s3Endpoint = process.env.S3_ENDPOINT_API || process.env.S3_ENDPOINT;
const s3AccessKey =
  process.env.S3_API_KEY ||
  process.env.S3_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID;
const s3SecretKey =
  process.env.S3_API_SECRET ||
  process.env.S3_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY;
const s3Bucket = process.env.S3_BUCKET;

export const FOLDER_ZDJEC_SPRZETU =
  process.env.S3_ITEMS_IMAGES || "items/images/";
export const FOLDER_ZDJEC_KATEGORII =
  process.env.S3_CATEGORIES_IMAGES || "categories/images/";

const s3Config = {
  region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
  endpoint: s3Endpoint || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
};

if (s3AccessKey && s3SecretKey) {
  s3Config.credentials = {
    accessKeyId: s3AccessKey,
    secretAccessKey: s3SecretKey
  };
}

const s3Client = new S3Client(s3Config);

function czyS3Skonfigurowane() {
  return Boolean(s3Bucket && s3AccessKey && s3SecretKey);
}

function normalizujFolderS3(folder) {
  return folder.endsWith("/") ? folder : `${folder}/`;
}

function rozszerzeniePliku(nazwaPliku) {
  const czesci = nazwaPliku.split(".");

  if (czesci.length < 2) {
    return "";
  }

  return `.${czesci.pop().toLowerCase()}`;
}

function kluczZdjecia(plik, folder) {
  return `${normalizujFolderS3(folder)}${crypto.randomUUID()}${rozszerzeniePliku(
    plik.originalname
  )}`;
}

export function pobierzKluczS3(zdjecieUrl) {
  if (!zdjecieUrl) {
    return null;
  }

  if (
    process.env.S3_WEB_ENDPOINT &&
    zdjecieUrl.startsWith(process.env.S3_WEB_ENDPOINT)
  ) {
    return zdjecieUrl
      .replace(process.env.S3_WEB_ENDPOINT, "")
      .replace(/^\/+/, "");
  }

  if (/^https?:\/\//i.test(zdjecieUrl)) {
    return null;
  }

  return zdjecieUrl;
}

export async function dodajZdjecieDoS3(
  plik,
  folder = FOLDER_ZDJEC_SPRZETU
) {
  if (!czyS3Skonfigurowane()) {
    throw new Error("Brak konfiguracji S3.");
  }

  const key = kluczZdjecia(plik, folder);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: plik.buffer,
      ContentType: plik.mimetype
    })
  );

  return key;
}

export async function usunZdjecieZS3(zdjecieUrl) {
  const key = pobierzKluczS3(zdjecieUrl);

  if (!key) {
    return;
  }

  if (!czyS3Skonfigurowane()) {
    throw new Error("Brak konfiguracji S3.");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: key
    })
  );
}

export async function usunZdjeciaZS3(zdjeciaUrl) {
  const zdjecia = uporzadkujZdjeciaUrl(zdjeciaUrl);

  for (const url of Object.values(zdjecia)) {
    await usunZdjecieZS3(url);
  }
}
