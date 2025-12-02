import { put, del } from "@vercel/blob";

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.dental_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.warn("Warning: BLOB_READ_WRITE_TOKEN not found in environment variables");
}

/**
 * Upload a file to Vercel Blob storage
 * @param file - The file to upload (File or Buffer)
 * @param path - The path/filename for the blob (e.g., "clinical-images/patient_123_image.jpg")
 * @param contentType - Optional content type (MIME type)
 * @returns The URL of the uploaded file
 */
export async function uploadToBlob(
  file: File | Buffer,
  path: string,
  contentType?: string
): Promise<string> {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    let mimeType = contentType;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = mimeType || file.type;
    } else {
      buffer = file;
    }

    // Upload to Vercel Blob
    const blob = await put(path, buffer, {
      access: "public",
      token: BLOB_READ_WRITE_TOKEN,
      contentType: mimeType,
    });

    return blob.url;
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw new Error(`Failed to upload file to blob storage: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete a file from Vercel Blob storage
 * @param url - The URL of the blob to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  try {
    await del(url, {
      token: BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error("Error deleting from Vercel Blob:", error);
    throw new Error(`Failed to delete file from blob storage: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a unique filename for blob storage
 * @param prefix - Prefix for the filename (e.g., "clinical-images", "documents")
 * @param identifier - Unique identifier (e.g., patientId, clinicId)
 * @param originalName - Original filename
 * @returns A unique filename path
 */
export function generateBlobPath(
  prefix: string,
  identifier: string,
  originalName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const extension = sanitizedFileName.split(".").pop() || "";
  const nameWithoutExt = sanitizedFileName.replace(/\.[^/.]+$/, "");
  
  return `${prefix}/${identifier}_${timestamp}_${nameWithoutExt}.${extension}`;
}

