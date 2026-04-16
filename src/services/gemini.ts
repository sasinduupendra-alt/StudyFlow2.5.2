import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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

export function getImageAI() {
  // Use process.env.API_KEY if available (user-selected key), otherwise fallback to default
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key is not set');
  }
  return new GoogleGenAI({ apiKey });
}

export const MODELS = {
  GENERAL: 'gemini-3-flash-preview',
  COMPLEX: 'gemini-3.1-pro-preview',
  FAST: 'gemini-3.1-flash-lite-preview',
  IMAGE: 'gemini-3-pro-image-preview',
};

export async function generateStudyPlan(subject: string, topics: string[]) {
  const prompt = `Create a detailed study plan for the subject "${subject}" covering these topics: ${topics.join(", ")}. 
  Provide specific focus areas, estimated time per topic, and a suggested resource type (video, reading, practice).
  Format the response in Markdown.`;

  const ai = getAI();
  const result = await ai.models.generateContent({
    model: MODELS.GENERAL,
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
    model: MODELS.COMPLEX,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });
  return result.text;
}

export async function generateStudyImage(prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") {
  const ai = getImageAI();
  const response = await ai.models.generateContent({
    model: MODELS.IMAGE,
    contents: {
      parts: [
        {
          text: `Generate a high-quality technical study illustration or diagram: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio,
        imageSize
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

// Support for streaming
export async function* streamStudyAdvice(topic: string) {
  const prompt = `Provide quick, actionable study advice for the topic: "${topic}". 
  Keep it concise and encouraging. Format in Markdown.`;

  const ai = getAI();
  const result = await ai.models.generateContentStream({
    model: MODELS.FAST,
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
}
