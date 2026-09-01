const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

/* ─────────────────────────────────────────────
   Multer — keep the file in memory as a Buffer,
   we stream it straight to Cloudinary (no disk writes)
───────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Helper: pipe a buffer into Cloudinary's upload_stream as a Promise
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      {
        folder: "agrighar/products",
        resource_type: "image",
        transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(cldStream);
  });
};

// ── POST /api/upload/image ────────────────────────────────────
// Farmer only — upload a single product image, returns Cloudinary URL
router.post(
  "/image",
  protect,
  authorize("farmer"),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const result = await streamUpload(req.file.buffer);

      res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      // Log the FULL error object — Cloudinary puts the real reason in
      // fields like http_code / error.message, not just err.message
      console.error("❌ Cloudinary upload failed. Full error:", JSON.stringify(err, null, 2));
      res.status(500).json({
        message: "Image upload failed",
        error: err?.message || String(err),
        http_code: err?.http_code,
      });
    }
  }
);

// ── DELETE /api/upload/image/:publicId ────────────────────────
// Farmer only — remove an image from Cloudinary (publicId must be URL-encoded,
// e.g. agrighar%2Fproducts%2Fabc123)
router.delete("/image/:publicId", protect, authorize("farmer"), async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ message: "Image deletion failed", error: err.message });
  }
});

module.exports = router;