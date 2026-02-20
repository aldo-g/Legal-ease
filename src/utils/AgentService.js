import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * AgentService uses Gemini LLM to research complaints and generate pressure plans.
 */
export const AgentService = {
  _getAI: () => {
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  },

  researchComplaint: async (complaintText) => {
    const model = AgentService._getAI();

    const prompt = `
      You are a Procedural Assessment System for a consumer disruption platform.
      The user has provided this factual account: "${complaintText}"

      Your task:
      1. Categorize the incident (e.g., CIVIL_AVIATION_DISRUPTION, PRODUCT_LIABILITY, SERVICE_CONTRACT_BREACH).
      2. Identify the specific regulatory framework applies (e.g. EU 261/2004, UK Consumer Rights Act 2015). Use serious, technical names.
      3. Summarize the applicable legal framework in a sober, objective tone. Avoid "You have rights" - use "The regulation specifies obligations for..."
      4. Identify the specific data points required to build a formal case dossier.
      5. Identify potential areas of compensation or remedies available under the applicable regulation. For each area, provide a short title, a one-sentence description of the entitlement, and an estimated value range where possible (e.g. "€250 – €600" or "Reasonable costs"). Use factual, objective language.
      6. For each field in requiredInfo, extract the value from the user's complaint text if it can be determined. Put these in "suggestedValues" as a flat object keyed by the field id. Only include fields where you are reasonably confident of the value. Use null for fields you cannot determine.
      7. Generate a short case title (5-8 words max) suitable for display in a case list. Format: "Company — Incident Type" or "Carrier Name Flight Delay" etc.

      Return ONLY a JSON object in the following format:
      {
        "type": "STRING_UPPERCASE",
        "baseJustification": "Official Name of Regulation",
        "summary": "Objective description of relevant regulatory clauses.",
        "title": "Short case title",
        "requiredInfo": [
          { "id": "unique_id", "label": "Technical Label (e.g. Flight Reference)", "placeholder": "Example", "type": "text|date|number|textarea" }
        ],
        "suggestedValues": { "field_id": "extracted value or null" },
        "compensationAreas": [
          { "title": "Short title", "description": "One-sentence explanation of entitlement.", "estimate": "Value range or null if not quantifiable" }
        ]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      return JSON.parse(text.substring(jsonStart, jsonEnd));
    } catch (error) {
      console.error("Assessment Error:", error);
      throw error;
    }
  },

  generatePressurePlan: async (complaintType, info, research) => {
    const model = AgentService._getAI();

    const prompt = `
      As a Procedural Strategy System, generate a Case Dossier for:
      Incident Category: ${complaintType}
      Applicable Regulation: ${research.baseJustification}
      Validated User Data: ${JSON.stringify(info)}

      Generate:
      1. An ordered timeline of action steps the user should take to pursue their claim. Each step should have a title, description, and a suggested timeframe (e.g. "Immediately", "Within 7 days", "After 14 days"). Steps should be in chronological order. Include 4-7 steps covering: initial correspondence, waiting period, follow-up, escalation options.
      2. A formal claim email ready to send:
         - A suggested subject line: "Formal claim under [Regulation] – [Identifier]"
         - The name of the company/organisation to send it to (based on the incident)
         - A suggested recipient email address or department (e.g. "customer.relations@airline.com" or "Customer Relations Department"). If unsure, use a realistic placeholder.
         - The full email body text. Use a factual, restrained tone. No greetings like "Hope you are well". Numbered paragraphs for facts. Explicitly cite ${research.baseJustification}. Include placeholders in square brackets for anything the user needs to fill in, like [YOUR FULL NAME] or [YOUR ADDRESS].
      3. A list of required evidentiary items the user should gather.

      Return ONLY a JSON object in the following format:
      {
        "timeline": [
          { "title": "Step title", "description": "What to do and why.", "timeframe": "When to do it" }
        ],
        "email": {
          "subject": "The email subject line",
          "recipientName": "Company or department name",
          "recipientEmail": "email@example.com",
          "body": "The full email body text"
        },
        "checklist": ["Evidence Item 1", "Evidence Item 2"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      return JSON.parse(text.substring(jsonStart, jsonEnd));
    } catch (error) {
      console.error("Dossier Generation Error:", error);
      throw error;
    }
  },

  analyzeUpdate: async (update, research, previousLogs) => {
    const model = AgentService._getAI();

    const logSummary = previousLogs
      .slice(0, 10)
      .map(l => `[${l.timestamp}] ${l.message}`)
      .join('\n');

    const prompt = `
      You are a Case Tracking Agent for a consumer rights enforcement platform.

      Case context:
      - Applicable regulation: ${research.baseJustification}
      - Previous case log:\n${logSummary}

      The user has logged a new update: "${update}"

      Analyze this update and provide:
      1. A brief assessment of what this means for the case (1-2 sentences).
      2. A specific recommended next action the user should take.
      3. If the other party has responded, whether the response is satisfactory, partial, or inadequate.
      4. Whether the case should be escalated (e.g. to a regulator, ombudsman, or small claims court).
      5. A suggested new deadline in days from now for the next action (e.g. 7, 14, 30).
      6. If escalation is recommended, draft a brief escalation letter/email body.

      Return ONLY a JSON object:
      {
        "assessment": "Brief assessment of the update.",
        "nextAction": "Specific recommended next action.",
        "responseQuality": "satisfactory|partial|inadequate|not_applicable",
        "shouldEscalate": true/false,
        "newDeadlineDays": 14,
        "escalationDraft": "Escalation letter text or null if not escalating"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      return JSON.parse(text.substring(jsonStart, jsonEnd));
    } catch (error) {
      console.error("Update Analysis Error:", error);
      throw error;
    }
  }
};
