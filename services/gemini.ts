
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const refineTaskDescription = async (rawDescription: string, category: string): Promise<string> => {
  if (!apiKey) {
    console.warn("Gemini API Key missing");
    return rawDescription;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an assistant for a student task marketplace. 
      Refine the following task description to be clear, professional, and actionable. 
      The category is "${category}".
      
      Raw Description: "${rawDescription}"
      
      Output ONLY the refined description text. Do not add conversational filler.`,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return rawDescription; // Fallback to original
  }
};

export interface PricingSuggestion {
  price: number;
  confidence: number;
  reasoning: string;
  breakdown: {
    base: number;
    difficulty: number;
    urgencyMultiplier: number;
    lengthFee: number;
  }
}

export const suggestPricing = async (title: string, description: string, category: string = 'General'): Promise<PricingSuggestion | null> => {
  if (!apiKey) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an experienced student freelancer. Suggest a fair price in Indian Rupees (₹) for this task using human logic.
      
      Task Details:
      - Title: "${title}"
      - Category: "${category}"
      - Description: "${description}"
      
      Pricing Rules (Human Logic):
      1. **Base Rates**: 
         - Academic/Writing: ₹300 minimum. ₹1 per word if length inferred.
         - Programming: ₹800 minimum for scripts. ₹3000+ for full applications.
         - Errands: ₹150 base + travel allowance.
         - Design: ₹500 for logos/posters.
      2. **Urgency**: Check for keywords "ASAP", "Urgent", "Tonight", "Tomorrow". If found, apply a 1.5x - 2.0x multiplier.
      3. **Complexity**: Vague descriptions = higher risk = higher price. Technical terms = Difficulty Fee.
      
      Return a JSON object with this EXACT structure (no markdown):
      {
        "price": number, // Final total suggested price (rounded to nearest 10)
        "confidence": number, // 0 to 100 based on clarity
        "reasoning": "Explain calculation like a human (e.g., 'Base ₹500 + 1.5x urgency multiplier').",
        "breakdown": {
          "base": number, // Base rate for this task type
          "difficulty": number, // Extra fee for skills/complexity
          "urgencyMultiplier": number, // e.g., 1.0 (normal), 1.5 (urgent)
          "lengthFee": number // Extra fee for large volume work
        }
      }`,
    });
    
    const text = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Pricing Error:", error);
    return null;
  }
}
