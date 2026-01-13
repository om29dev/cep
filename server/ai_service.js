const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

async function analyzeComplaint(description) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found in environment. Using fallback categorization.");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
            Analyze the following citizen complaint for an "Urban Water Intelligence System".
            IMPORTANT: We only deal with WATER-RELATED problems.
            Complaint: "${description}"

            If the complaint is NOT related to water (e.g., roads, electricity, noise, theft), set the category to "Non-Water Related".

            Provide the response in the following JSON format:
            {
                "category": "One of: No Water Supply, Water Leakage, Contaminated Water, Low Water Pressure, Drainage & Sewage, Illegal Connection, Non-Water Related",
                "urgency": "One of: Low, Medium, High, Emergency",
                "summary": "A concise 1-sentence summary of the issue.",
                "sentiment": "One of: Frustrated, Neutral, Appreciative, Angry",
                "is_spam": true/false,
                "spam_reason": "If spam, explain why (e.g. Gibberish, Irrelevant, Abusive, Test Data). Otherwise null."
            }

            STRICTLY MARK AS SPAM IF:
            1. The input is random gibberish (e.g., "sdfghj", "123123").
            2. It contains absolutely no meaningful information.
            3. It is clearly test data (e.g., "test test test").
            4. It is abusive or offensive without reporting a valid issue.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response in case the model includes markdown formatting
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return null;
    }
}

module.exports = { analyzeComplaint };
