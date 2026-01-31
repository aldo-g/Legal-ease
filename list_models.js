import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
    if (!API_KEY) {
        console.error("No API key found in .env");
        return;
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    try {
        const list = await genAI.listModels();
        console.log("AVAILABLE MODELS:");
        list.models.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (err) {
        console.error("Error listing models:", err);
    }
}

listModels();
