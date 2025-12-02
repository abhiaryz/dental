import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToBlob, generateBlobPath } from "@/lib/vercel-blob";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'logo' or 'document'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (5MB for logos, 10MB for documents)
    const maxSize = type === "logo" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === "logo") {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPG, PNG, and SVG are allowed" },
          { status: 400 }
        );
      }
    }

    // Generate blob path and upload to Vercel Blob
    const identifier = session.user.id || "temp";
    const blobPath = generateBlobPath(type, identifier, file.name);
    const url = await uploadToBlob(file, blobPath, file.type);

    return NextResponse.json({
      message: "File uploaded successfully",
      url,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

