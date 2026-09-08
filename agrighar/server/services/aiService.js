/* ─────────────────────────────────────────────────────────────
   AGRI Sahayak AI — AI Service
   All AI-provider logic (prompts, API calls, response parsing)
   lives here so routes/controllers stay thin.

   Provider: Google Gemini (supports both vision + text in one
   API), called via the native generateContent REST endpoint.
   Requires GEMINI_API_KEY in the environment — never hardcode it.
   Get a free key at https://aistudio.google.com
───────────────────────────────────────────────────────────── */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.AI_MODEL || "gemini-3.6-flash";

/* ── Low-level call to Gemini generateContent ──────────────────
   `contents` follows Gemini's { role, parts: [...] } shape.
   `systemInstruction` is plain text.
   `jsonMode` asks Gemini to return raw JSON (used for crop analysis). */
async function callGemini({ systemInstruction, contents, jsonMode = false, maxTokens = 1024 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "AI service is not configured. Set GEMINI_API_KEY in the server .env file."
    );
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    const err = new Error(`AI provider request failed (${response.status}): ${errText}`);
    err.code = "AI_PROVIDER_ERROR";
    throw err;
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("").trim();
}

/* ── Safely pull a JSON object out of a model response ────────── */
function safeParseJSON(rawText) {
  if (!rawText) return null;
  // Strip markdown code fences if the model wrapped the JSON in one
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to salvage the first {...} block if there's stray text around it
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/* ── Feature 1: Crop Disease Detection ─────────────────────────
   Sends the crop/leaf image to Gemini's vision capability and
   asks for a structured, non-diagnostic assessment.
──────────────────────────────────────────────────────────────── */
const CROP_ANALYSIS_SYSTEM_PROMPT = `You are AGRI Sahayak AI, an agriculture assistant integrated into the AGRIghar FarmToFresh platform.

A user has uploaded a photo of a crop or leaf and wants help understanding what they're seeing.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary before or after) matching exactly this shape:

{
  "cropName": "string - best guess at the crop/plant, or 'Unknown' if unclear",
  "possibleIssue": "string - the likely disease/problem, or 'No obvious issue detected' if the plant looks healthy",
  "confidence": "string - e.g. 'High', 'Moderate', 'Low'",
  "severity": "string - e.g. 'Mild', 'Moderate', 'Severe', 'None'",
  "symptoms": ["array of short strings describing visible symptoms"],
  "possibleCauses": ["array of short strings"],
  "recommendedActions": ["array of short, practical action items"],
  "preventionTips": ["array of short, practical prevention tips"],
  "expertConsultation": "string - guidance on when/whether to consult an agricultural expert"
}

IMPORTANT RULES:
- Never present this as a guaranteed or certain diagnosis. Use language like "possible", "likely", "AI-based assessment".
- Keep every array item short (one line) and practical for a farmer to act on.
- If the image is not a plant/crop/leaf at all, set cropName to "Unknown" and possibleIssue to "Image does not appear to show a crop or plant" and leave the other arrays minimal.
- Output raw JSON only. Do not wrap it in markdown code fences.`;

async function analyzeCropImage({ base64Image, mimeType }) {
  const rawText = await callGemini({
    systemInstruction: CROP_ANALYSIS_SYSTEM_PROMPT,
    maxTokens: 1024,
    jsonMode: true,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Analyze this crop/leaf image and return the JSON assessment as instructed." },
        ],
      },
    ],
  });

  const parsed = safeParseJSON(rawText);
  if (!parsed) {
    const err = new Error("AI returned an unexpected response format. Please try again.");
    err.code = "AI_PARSE_ERROR";
    throw err;
  }

  // Normalize shape so downstream code never has to guard against missing fields
  return {
    cropName: parsed.cropName || "Unknown",
    possibleIssue: parsed.possibleIssue || "Unable to determine",
    confidence: parsed.confidence || "Low",
    severity: parsed.severity || "Unknown",
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    preventionTips: Array.isArray(parsed.preventionTips) ? parsed.preventionTips : [],
    expertConsultation:
      parsed.expertConsultation ||
      "If symptoms worsen or spread, consult a local agricultural expert.",
  };
}

/* ── Feature 2: Agriculture Assistant Chat ─────────────────────
   Free-form Q&A in English / Hindi / Hinglish, aware of any
   linked crop analysis from Feature 1.
──────────────────────────────────────────────────────────────── */
function buildChatSystemPrompt(analysisContext) {
  let prompt = `You are AGRI Sahayak AI, an intelligent agriculture assistant integrated into the AGRIghar FarmToFresh platform.

Your purpose is to help farmers and users with practical agriculture guidance: crop diseases, crop care, farming techniques, soil health, irrigation, seasonal farming guidance, plant nutrition, and general pest prevention.

Respond in the same language/style the user writes in — English, Hindi, or Hinglish. If they write in Hinglish, reply naturally in Hinglish.

Keep answers practical, easy to understand, and concise (a few short paragraphs or a short bulleted list at most).

Never claim absolute certainty when discussing crop diseases — clearly distinguish possible issues from confirmed diagnoses, and suggest consulting a local agricultural expert for serious or worsening problems.`;

  if (analysisContext) {
    prompt += `

The user previously scanned a crop image and received this AI-based analysis. They may refer to it indirectly using words like "this", "it", "iske", or "iska" — treat those as referring to the analysis below:

Crop: ${analysisContext.cropName}
Possible Issue: ${analysisContext.possibleIssue}
Severity: ${analysisContext.severity}
Symptoms: ${(analysisContext.symptoms || []).join(", ") || "N/A"}
Possible Causes: ${(analysisContext.possibleCauses || []).join(", ") || "N/A"}`;
  }

  return prompt;
}

async function chatWithAssistant({ message, history = [], analysisContext = null }) {
  // Gemini uses role "model" (not "assistant") for AI turns
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const reply = await callGemini({
    systemInstruction: buildChatSystemPrompt(analysisContext),
    maxTokens: 800,
    contents,
  });

  return reply || "Sorry, I couldn't generate a response. Please try again.";
}

module.exports = {
  analyzeCropImage,
  chatWithAssistant,
};
