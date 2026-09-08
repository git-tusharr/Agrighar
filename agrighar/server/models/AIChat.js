const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const aiChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    relatedAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: "AIAnalysis", default: null },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

aiChatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("AIChat", aiChatSchema);
