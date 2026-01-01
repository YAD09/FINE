
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
// Use the mandatory named parameter for apiKey and assume process.env.API_KEY is pre-configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Refines a task description to be professional and clear using Gemini.
 */
export const refineTaskDescription = async (rawDescription: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an assistant for a student task marketplace. 
      Refine the following task description to be clear, professional, and actionable. 
      The category is "${category}".
      
      Raw Description: "${rawDescription}"
      
      Output ONLY the refined description text. Do not add conversational filler.`,
    });

    // The text output is obtained via the .text property on the GenerateContentResponse object.
    const text = response.text;
    return text?.trim() || rawDescription;
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

/**
 * Suggests a fair price for a student task using Gemini with a structured JSON response.
 */
export const suggestPricing = async (title: string, description: string, category: string = 'General'): Promise<PricingSuggestion | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Complex Text Tasks benefit from the Pro model
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
      3. **Complexity**: Vague descriptions = higher risk = higher price. Technical terms = Difficulty Fee.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { 
              type: Type.NUMBER, 
              description: "Final total suggested price (rounded to nearest 10)" 
            },
            confidence: { 
              type: Type.NUMBER, 
              description: "0 to 100 based on clarity" 
            },
            reasoning: { 
              type: Type.STRING, 
              description: "Explain calculation like a human (e.g., 'Base ₹500 + 1.5x urgency multiplier')." 
            },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                base: { type: Type.NUMBER, description: "Base rate for this task type" },
                difficulty: { type: Type.NUMBER, description: "Extra fee for skills/complexity" },
                urgencyMultiplier: { type: Type.NUMBER, description: "e.g., 1.0 (normal), 1.5 (urgent)" },
                lengthFee: { type: Type.NUMBER, description: "Extra fee for large volume work" }
              },
              required: ["base", "difficulty", "urgencyMultiplier", "lengthFee"]
            }
          },
          required: ["price", "confidence", "reasoning", "breakdown"]
        }
      }
    });
    
    // The response features a text property which contains the generated JSON string.
    const text = response.text;
    if (!text) return null;
    const jsonStr = text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Pricing Error:", error);
    return null;
  }
}
