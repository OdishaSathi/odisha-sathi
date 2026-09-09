"use client";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type StorageError,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_TIMEOUT_MS = 45000;

type UploadImageOptions = {
  folder: string;
  fallbackName?: string;
};

function createUploadError(code: string, message: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

function cleanFolderName(folder: string) {
  return folder
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

function cleanFileName(fileName: string, fallbackName = "image") {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || fallbackName;
}

export function getImageFileValidationError(file?: File) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) {
    return "Please select a valid image file.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image size must be 5 MB or less.";
  }
  return "";
}

export function getImageUploadErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as StorageError | { code?: unknown }).code || "")
      : "";

  if (code === "odisha-sathi/no-storage-bucket") {
    return "Firebase Storage bucket is not configured. Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, or paste a direct image URL.";
  }

  if (code === "odisha-sathi/upload-timeout") {
    return "Image upload took too long and was stopped. Check internet/Firebase Storage setup, or paste a direct image URL.";
  }

  if (code === "storage/unauthorized") {
    return "Image upload was blocked by Firebase Storage permission. Update Storage rules, or paste a direct image URL.";
  }

  if (code === "storage/canceled") {
    return "Image upload was stopped. Please try again or paste a direct image URL.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "Image upload could not complete after retries. Check network/Firebase Storage, or paste a direct image URL.";
  }

  return error instanceof Error && error.message
    ? error.message
    : "Image upload failed. Please retry or paste a direct image URL.";
}

export async function uploadImageFile(
  file: File | undefined,
  { folder, fallbackName = "image" }: UploadImageOptions
) {
  const validationError = getImageFileValidationError(file);
  if (validationError) {
    throw createUploadError("odisha-sathi/invalid-image", validationError);
  }

  if (!file) {
    throw createUploadError("odisha-sathi/no-file", "Please select an image.");
  }

  const storageBucket = storage.app.options.storageBucket;
  if (!storageBucket || !String(storageBucket).trim()) {
    throw createUploadError(
      "odisha-sathi/no-storage-bucket",
      "Firebase Storage bucket is not configured."
    );
  }

  const folderName = cleanFolderName(folder) || "post-images";
  const imageRef = ref(
    storage,
    `${folderName}/${Date.now()}-${cleanFileName(file.name, fallbackName)}`
  );
  const uploadTask = uploadBytesResumable(imageRef, file, {
    contentType: file.type,
  });

  let didTimeout = false;
  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    uploadTask.cancel();
  }, IMAGE_UPLOAD_TIMEOUT_MS);

  try {
    await new Promise<void>((resolve, reject) => {
      uploadTask.on("state_changed", undefined, reject, resolve);
    });
    return await getDownloadURL(uploadTask.snapshot.ref);
  } catch (error) {
    if (didTimeout) {
      throw createUploadError(
        "odisha-sathi/upload-timeout",
        "Image upload timed out."
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
