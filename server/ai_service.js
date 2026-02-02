const { pipeline, env } = require('@xenova/transformers');
const path = require('path');

// Configure local cache directory for models so they are not downloaded every time
env.cacheDir = path.join(__dirname, 'models');
env.allowLocalModels = true;

// Cache the pipelines to avoid reloading
let classifier = null;

// Categories as specified by the user
const CANDIDATE_LABELS = [
    "New Connection",
    "Water Leakage",
    "Water Contamination",
    "No Water Supply",
    "Low Water Pressure",
    "Sewerage/Drainage Blockage",
    "Billing & Payment Issues",
    "Water Wastage Reporting",
    "Damaged Main Valve/Infrastructure",
    "Open/Broken Manhole",
    "Supply Schedule Irregularity",
    "Non-Water Related"
];

// Heuristics for Urgency based on category
const URGENCY_LABELS = [
    "Critical Emergency",
    "High Urgency",
    "Medium Urgency",
    "Low Urgency"
];

const FINAL_URGENCY_MAP = {
    "Critical Emergency": "Emergency",
    "High Urgency": "High",
    "Medium Urgency": "Medium",
    "Low Urgency": "Low"
};

async function getClassifier() {
    if (!classifier) {
        console.log("Loading Zero-Shot Classifier (Roberta)...");
        // Using roberta-large-mnli as requested/implied for robust zero-shot classification
        classifier = await pipeline('zero-shot-classification', 'Xenova/roberta-large-mnli');
    }
    return classifier;
}

async function analyzeComplaint(description) {
    try {
        // 1. SPAM CHECK (Improved Heuristics)
        if (!description || description.trim().length < 5) {
            return {
                category: "Non-Water Related",
                urgency: "Low",
                is_spam: true,
                spam_reason: "Too short / Empty"
            };
        }

        // Check for legitimacy keywords (water-related or complaint indicators)
        const legitimacyKeywords = ["water", "leak", "supply", "billing", "drainage", "hygiene", "health", "days", "locality"];
        const hasLegitimacy = legitimacyKeywords.some(keyword => description.toLowerCase().includes(keyword));
        if (!hasLegitimacy) {
            return {
                category: "Non-Water Related",
                urgency: "Low",
                is_spam: true,
                spam_reason: "No relevant keywords detected"
            };
        }

        // Refined gibberish regex: avoid flagging repetitive but meaningful text
        const gibberishRegex = /^(.)\1{4,}$|^([asdfjkl;]{5,})$|^([1234567890]{6,})$/i; // Increased thresholds for repetition
        if (gibberishRegex.test(description.replace(/\s/g, ''))) {
            return {
                category: "Non-Water Related",
                urgency: "Low",
                is_spam: true,
                spam_reason: "Gibberish detected"
            };
        }

        // 2. CLASSIFICATION (Roberta) - Category
        const classify = await getClassifier();
        const categoryResult = await classify(description, CANDIDATE_LABELS);
        const topCategory = categoryResult.labels[0];
        const categoryScore = categoryResult.scores[0];

        // Fallback for very low confidence
        const finalCategory = categoryScore > 0.15 ? topCategory : "Non-Water Related";

        // 3. CLASSIFICATION (Roberta) - Urgency (Context-aware)
        // We re-use the same zero-shot classifier but with urgency labels
        const urgencyResult = await classify(description, URGENCY_LABELS);
        const topUrgencyLabel = urgencyResult.labels[0];
        const finalUrgency = FINAL_URGENCY_MAP[topUrgencyLabel] || "Medium";

        return {
            category: finalCategory,
            urgency: finalUrgency,
            is_spam: false,
            spam_reason: null
        };

    } catch (error) {
        console.error("AI Analysis Error (Local Roberta):", error);
        // Fallback return
        return {
            category: "Non-Water Related",
            urgency: "Low",
            is_spam: false,
            spam_reason: null
        };
    }
}

module.exports = { analyzeComplaint };
