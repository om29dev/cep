const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');

/**
 * Analyze a water complaint context and user query to provide officer assistance
 * @param {Object} complaint - The full complaint object
 * @param {String} query - The specific question from the officer
 * @param {Array} history - Previous chat history (optional)
 * @returns {Object} AI response with text and suggested actions
 */
async function askOfficerAssistant(complaint, query, history = []) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an AI assistant for the Urban Water Intelligence System (UIIS), helping a municipal water officer resolve a citizen issue.
        
        CONTEXT:
        A citizen has reported the following issue:
        - ID: #${complaint.id}
        - Category: ${complaint.category}
        - Description: "${complaint.description}"
        - Location/Ward: ${complaint.location} (${complaint.ward})
        - Reported: ${new Date(complaint.created_at).toLocaleString()}
        - Status: ${complaint.status}
        - AI Priority Score: ${complaint.ai_urgency || 'Unknown'}

        OFFICER'S QUESTION:
        "${query}"

        INSTRUCTIONS:
        1. Answer the officer's question directly and professionally.
        2. Provide technical or operational advice relevant to water management (e.g., integrity checks, deployment, testing).
        3. If the officer asks for a resolution message, draft a polite response to the citizen.
        4. Be concise and actionable.

        RESPONSE FORMAT:
        Return a JSON object with:
        {
            "answer": "Your detailed answer here...",
            "suggestedAction": "Short action title (e.g., 'Deploy Team' or 'Send Reply')",
            "confidence": "High/Medium/Low"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response (handling potential markdown code blocks)
        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            // Fallback if model returns plain text
            return {
                answer: text,
                suggestedAction: "Review",
                confidence: "Medium"
            };
        }

    } catch (error) {
        console.error("Gemini Assistant Error:", error);
        return {
            answer: "I'm having trouble connecting to the AI service right now. Please try again later.",
            suggestedAction: "Retry",
            confidence: "Low",
            error: true
        };
    }
}

/**
 * Generate a formal complaint letter for a citizen
 * @param {Object} details - { issue, location, area, officerName, ward }
 * @returns {String} The generated letter text
 */
async function generateCitizenLetter(details) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Write a formal and polite complaint letter from a concerned citizen to a municipal officer regarding a water issue.
        
        DETAILS:
        - Officer Name: ${details.officerName || 'The Water Department Officer'}
        - Department: PCMC Water Supply Department
        - Location: ${details.location}
        - Area/Ward: ${details.area} (Ward: ${details.ward})
        - Issue Description: "${details.issue}"
        - Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

        INSTRUCTIONS:
        1. Use a standard formal letter format (To, Date, Subject, Salutation, Body, Closing).
        2. The tone should be polite, respectful, yet firm about the inconvenience caused.
        3. Clearly state the issue and the location.
        4. Request prompt action and a resolution.
        5. Sign off as "A Concerned Citizen" (or leave space for name).
        6. Do NOT use placeholders like [Your Name] or [Address] unless absolutely necessary - try to make it ready-to-send.
        7. Keep it concise (under 200 words).

        OUTPUT:
        Return ONLY the letter text. No markdown formatting like **bold** or *italics*.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();

    } catch (error) {
        console.error("Gemini Letter Gen Error:", error);
        return "Error generating letter. Please try again or write manually.";
    }
}

module.exports = { askOfficerAssistant, generateCitizenLetter };
