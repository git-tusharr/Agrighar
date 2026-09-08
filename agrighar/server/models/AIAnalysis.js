const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    imageUrl: { type: String, default: "" },

    cropName: { type: String, default: "Unknown" },
    possibleIssue: { type: String, default: "" },
    confidence: { type: String, default: "" },
    severity: { type: String, default: "" },

    symptoms: { type: [String], default: [] },
    possibleCauses: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    preventionTips: { type: [String], default: [] },
    expertConsultation: { type: String, default: "" },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
