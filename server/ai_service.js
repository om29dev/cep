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

async function detectPattern(complaints, area) {
    if (!process.env.GEMINI_API_KEY) return null;

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            You are an Urban Infrastructure Analyst.
            Analyze the following list of citizen complaints from the area/district: "${area}".
            
            Complaints:
            ${JSON.stringify(complaints)}

            Determine if there is a **Systemic Pattern** or **Major Infrastructure Failure** (high severity issue) emerging from these reports.
            Do NOT just count them. Look for semantic similarity (e.g., "burst pipe", "contaminated water", "no supply").
            
            Return a JSON object:
            {
                "detected": true/false, (True if a specific pattern represents a real issue, not just random complaints)
                "issue_title": "Short title of the systemic issue (e.g., 'Major Pipeline Burst in Sector 4')",
                "severity": "High/Medium/Low", (High if it affects critical needs like drinking water or safety)
                "confidence": 0-100,
                "summary": "Brief explanation of why this is a pattern."
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("AI Pattern Detection Error:", error);
        return null;
    }
}

module.exports = { analyzeComplaint, detectPattern };
