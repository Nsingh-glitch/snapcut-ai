import multer from "multer";
import type { Request, Response } from "express";
import { processImage, ProcessingError } from "../server/remove-bg.js";
import { getAuthenticatedUser } from "../server/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const config = {
  api: { bodyParser: false },
};

type RequestWithFile = Request & { file?: Express.Multer.File };
type UploadError = Error & { code?: string };

const parseUpload = upload.single("image") as unknown as (
  req: RequestWithFile,
  res: Response,
  next: (error?: UploadError) => void,
) => void;

export default function handler(req: RequestWithFile, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  return parseUpload(req, res, async (uploadError?: UploadError) => {
    if (uploadError) {
      const message = uploadError.code === "LIMIT_FILE_SIZE"
        ? "File too large. Max 10MB."
        : "Invalid image upload.";
      return res.status(uploadError.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        .json({ success: false, error: message });
    }

    try {
      const user = await getAuthenticatedUser(req);
      const result = await processImage(req.file, user.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      const statusCode = error instanceof ProcessingError || error.statusCode ? error.statusCode : 500;
      return res.status(statusCode).json({
        success: false,
        error: error instanceof ProcessingError || error.statusCode ? error.message : "Failed to process image.",
        ...(error.code ? { code: error.code } : {}),
      });
    }
  });
}