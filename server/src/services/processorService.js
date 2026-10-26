import sharp from "sharp";

export async function processFileBuffer(buffer, mimeType) {
  if (mimeType.startsWith("image/")) {
    const thumbnail = await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const medium = await sharp(buffer)
      .resize(800, 800, { fit: "inside" })
      .webp({ quality: 85 })
      .toBuffer();

    return {
      type: "image",
      variants: {
        thumbnail,
        medium,
      },
    };
  } else if (mimeType === "application/pdf" || mimeType === "text/plain") {
    return {
      type: "document",
      extractedTextLength: buffer.length,
    };
  }

  throw new Error(`Unsupported processing type for MIME type: ${mimeType}`);
}