import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not defined in the environment.');
  }
  return key;
};

let genAI: GoogleGenAI | null = null;

export const getAI = () => {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: getApiKey() });
  }
  return genAI;
};

export const MODELS = {
  GENERAL: 'gemini-3-flash-preview',
  COMPLEX: 'gemini-3.1-pro-preview',
  IMAGE: 'gemini-2.5-flash-image',
};

export const generateFeynmanSummary = async (notes: string, taskName: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.GENERAL,
      contents: `You are a high-SNR Study Assistant. The user just finished a deep work session on "${taskName}".
      Here are their notes and explanation:
      ---
      ${notes}
      ---
      Using the Feynman Technique, compress this into:
      1. Core Concept (1 sentence)
      2. Crucial Insights (3 bullets)
      3. Action Steps / Next Milestone (2 bullets)
      
      Be concise, technical, and high-performance. Avoid fluff.`
    });
    
    return response.text;
  } catch (error) {
    console.error("Feynman Summary Error:", error);
    return "Error synthesizing neural recap. Manual review recommended.";
  }
};

export async function* streamStudyAdvice(input: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContentStream({
      model: MODELS.GENERAL,
      contents: `You are a high-SNR Study Assistant. Give concise, actionable advice for: ${input}`
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch (error) {
    yield "Neural link unstable. Focus on core principles.";
  }
}

export const generateStudyImage = async (prompt: string, aspectRatio?: string, quality?: string) => {
  // Placeholder for image generation
  return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/450?aspect=${aspectRatio}&q=${quality}`;
};

export const analyzeFocusMomentum = async (history: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODELS.GENERAL,
      contents: `Analyze this study history and provide a short, 1-sentence high-performance motivation for the next session.
      History: ${JSON.stringify(history)}`
    });

    return response.text;
  } catch (error) {
    return "Neural momentum detected. Proceed to protocol.";
  }
};
