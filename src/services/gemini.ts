import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateStudyPlan(subject: string, topics: string[]) {
  const prompt = `Create a detailed study plan for the subject "${subject}" covering these topics: ${topics.join(", ")}. 
  Provide specific focus areas, estimated time per topic, and a suggested resource type (video, reading, practice).
  Format the response in Markdown.`;

  const ai = getAI();
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text;
}

export async function analyzeWeakAreas(logs: any[]) {
  const prompt = `Analyze these study logs and identify weak areas: ${JSON.stringify(logs)}.
  Provide actionable advice on how to improve in these areas.
  Format the response in Markdown.`;

  const ai = getAI();
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text;
}

// Support for streaming
export async function* streamStudyAdvice(topic: string) {
  const prompt = `Provide quick, actionable study advice for the topic: "${topic}". 
  Keep it concise and encouraging. Format in Markdown.`;

  const ai = getAI();
  const result = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
}
