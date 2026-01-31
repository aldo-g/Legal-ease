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

      Return ONLY a JSON object in the following format:
      {
        "type": "STRING_UPPERCASE",
        "baseJustification": "Official Name of Regulation",
        "summary": "Objective description of relevant regulatory clauses.",
        "requiredInfo": [
          { "id": "unique_id", "label": "Technical Label (e.g. Flight Reference)", "placeholder": "Example", "type": "text|date|number|textarea" }
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
      1. A procedural strategy (Formal tone, fact-based, no cleverness). Use numbered steps.
      2. A formal claim correspondence draft. 
         - Use a factual, restrained tone.
         - Subject line: "Formal claim under [Regulation] – [Identifier]"
         - No greetings like "Hope you are well".
         - Numbered paragraphs for facts.
         - Explicitly cite ${research.baseJustification}.
      3. A list of required evidentiary items.

      Return ONLY a JSON object in the following format:
      {
        "strategy": "The procedural steps",
        "email": "The formal correspondence text",
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
  }
};
