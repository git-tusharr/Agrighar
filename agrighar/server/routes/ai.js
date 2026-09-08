const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const { protect } = require("../middleware/auth");
const AIAnalysis = require("../models/AIAnalysis");
const AIChat = require("../models/AIChat");
const aiService = require("../services/aiService");

const router = express.Router();

/* ─────────────────────────────────────────────
   Multer — same pattern as routes/upload.js:
   keep the file in memory, stream to Cloudinary
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

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const cldStream = cloudinary.uploader.upload_stream(
      {
        folder: "agrighar/ai-scans",
        resource_type: "image",
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(cldStream);
  });
};

// Helper: translate a thrown aiService error into an HTTP response
const handleAIError = (res, err) => {
  console.error("❌ AGRI Sahayak AI error:", err.message);
  if (err.code === "AI_NOT_CONFIGURED") {
    return res.status(503).json({ message: err.message });
  }
  if (err.code === "AI_PARSE_ERROR") {
    return res.status(502).json({ message: err.message });
  }
  return res.status(500).json({ message: "AI request failed", error: err.message });
};

/* ── POST /api/ai/analyze-crop ──────────────────────────────────
   Any logged-in user — upload a crop/leaf image, get an AI-based
   structured assessment. Image is stored on Cloudinary and the
   analysis is saved to the user's history. */
router.post(
  "/analyze-crop",
  protect,
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

      const base64Image = req.file.buffer.toString("base64");

      // Run the Cloudinary upload (for a persistent record) and the AI
      // analysis (on the raw buffer, no need to wait for the URL) in parallel.
      const [cloudinaryResult, analysis] = await Promise.all([
        streamUpload(req.file.buffer).catch((err) => {
          console.error("❌ Cloudinary upload failed for AI scan:", err.message);
          return null; // Non-fatal — we can still show the analysis without a saved image
        }),
        aiService.analyzeCropImage({ base64Image, mimeType: req.file.mimetype }),
      ]);

      const savedAnalysis = await AIAnalysis.create({
        userId: req.user._id,
        imageUrl: cloudinaryResult?.secure_url || "",
        ...analysis,
      });

      res.status(201).json(savedAnalysis);
    } catch (err) {
      handleAIError(res, err);
    }
  }
);

/* ── POST /api/ai/chat ───────────────────────────────────────────
   Any logged-in user — chat with the agriculture assistant.
   Body: { message, chatId?, relatedAnalysisId? }
   - chatId: continue an existing conversation
   - relatedAnalysisId: link a previous crop scan as context
     (only needed on the first message of a conversation; it's
     stored on the chat so later turns keep the same context) */
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, chatId, relatedAnalysisId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "A message is required" });
    }

    // Find or create the conversation
    let chat = null;
    if (chatId) {
      chat = await AIChat.findOne({ _id: chatId, userId: req.user._id });
      if (!chat) return res.status(404).json({ message: "Conversation not found" });
    } else {
      chat = await AIChat.create({
        userId: req.user._id,
        relatedAnalysisId: relatedAnalysisId || null,
        messages: [],
      });
    }

    // Resolve linked crop analysis (if any) — verify it belongs to this user
    let analysisContext = null;
    if (chat.relatedAnalysisId) {
      const analysis = await AIAnalysis.findOne({
        _id: chat.relatedAnalysisId,
        userId: req.user._id,
      });
      if (analysis) analysisContext = analysis;
    }

    // Keep the last 10 messages as short-term memory for the model
    const history = chat.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const reply = await aiService.chatWithAssistant({
      message: message.trim(),
      history,
      analysisContext,
    });

    chat.messages.push({ role: "user", content: message.trim() });
    chat.messages.push({ role: "assistant", content: reply });
    await chat.save();

    res.json({
      chatId: chat._id,
      reply,
      relatedAnalysisId: chat.relatedAnalysisId,
    });
  } catch (err) {
    handleAIError(res, err);
  }
});

/* ── GET /api/ai/history ─────────────────────────────────────────
   Any logged-in user — their own crop scans + chat conversations */
router.get("/history", protect, async (req, res) => {
  try {
    const [analyses, chats] = await Promise.all([
      AIAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30),
      AIChat.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(30),
    ]);
    res.json({ analyses, chats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/ai/analysis/:id ────────────────────────────────────
   Any logged-in user — a single crop scan they own */
router.get("/analysis/:id", protect, async (req, res) => {
  try {
    const analysis = await AIAnalysis.findOne({ _id: req.params.id, userId: req.user._id });
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
