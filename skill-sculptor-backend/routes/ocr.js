import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import passport from "passport";
import { createRequire } from "module";

// Use createRequire to import the internal pdf-parse implementation directly,
// bypassing the debug harness in node_modules/pdf-parse/index.js
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

const router = express.Router();

// Configure multer for file uploads (memory storage, 10MB max)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only PDF and images (PNG, JPG, JPEG, WEBP) are allowed.`
        )
      );
    }
  },
});

// Helper: extract text from PDF using pdf-parse
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    const text = data?.text || "";

    if (!text || text.trim().length === 0) {
      throw new Error(
        "PDF appears to be image-based or contains no extractable text. Please try uploading an image instead."
      );
    }

    return text.trim();
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF: ${error?.message || "Unknown PDF parsing error"}`
    );
  }
}

// Helper: extract text from image using Tesseract OCR
async function extractTextFromImage(buffer) {
  try {
    console.log("Starting OCR process...");

    const { data } = await Tesseract.recognize(buffer, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
        }
      },
    });

    const text = data?.text?.trim() || "";
    if (!text || text.length === 0) {
      throw new Error(
        "Could not extract any text from the image. Please ensure the image contains clear, readable text."
      );
    }

    return text;
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error(
      `OCR failed: ${
        error?.message ||
        "Unable to process image. Please ensure the image is clear and contains readable text."
      }`
    );
  }
}

// Auto-detect file type and extract text (public - no auth, stateless)
router.post(
  "/extract",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No file uploaded. Please select a file to upload." });
      }

      console.log(
        `Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size} bytes`
      );

      let text = "";
      let extractionMethod = "";

      try {
        if (req.file.mimetype === "application/pdf") {
          extractionMethod = "PDF parsing";
          text = await extractTextFromPDF(req.file.buffer);
        } else if (req.file.mimetype.startsWith("image/")) {
          extractionMethod = "OCR (Optical Character Recognition)";
          text = await extractTextFromImage(req.file.buffer);
        } else {
          return res.status(400).json({
            error: `Unsupported file type: ${req.file.mimetype}. Please upload a PDF or image file (PNG, JPG, JPEG, WEBP).`,
          });
        }

        if (!text || text.length === 0) {
          return res.status(400).json({
            error:
              "No text could be extracted from the file. Please ensure the file contains readable text.",
          });
        }

        console.log(
          `Successfully extracted ${text.length} characters using ${extractionMethod}`
        );

        res.json({
          text,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          extractionMethod,
        });
      } catch (extractionError) {
        console.error("Extraction error:", extractionError);
        return res.status(500).json({
          error:
            extractionError?.message ||
            `Failed to extract text from ${
              req.file.mimetype.includes("pdf") ? "PDF" : "image"
            }. Please try a different file.`,
        });
      }
    } catch (error) {
      console.error("Upload/processing error:", error);

      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Maximum file size is 10MB." });
      }

      if (error.message && error.message.includes("Invalid file type")) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({
        error:
          error?.message ||
          "An unexpected error occurred while processing your file. Please try again later.",
      });
    }
  }
);

// Legacy: Extract text from PDF only (public - no auth, stateless)
router.post(
  "/extract-pdf",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const data = await pdf(req.file.buffer);
      const text = data?.text?.trim() || "";

      if (!text || text.length === 0) {
        throw new Error(
          "PDF appears to be image-based or contains no extractable text. Please try uploading an image instead."
        );
      }

      res.json({
        text,
        pages: data?.numpages || data?.numPages || 1,
        info: data?.info || {},
      });
    } catch (error) {
      console.error("PDF extraction error:", error);
      res.status(500).json({
        error:
          error?.message || "Failed to extract text from PDF. Please try again.",
      });
    }
  }
);

// Legacy: Extract text from image only (public - no auth, stateless)
router.post(
  "/extract-image",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const text = await extractTextFromImage(req.file.buffer);
      res.json({ text });
    } catch (error) {
      console.error("OCR extraction error:", error);
      res.status(500).json({
        error:
          error?.message ||
          "Failed to extract text from image. Please try a different image.",
      });
    }
  }
);

export default router;


