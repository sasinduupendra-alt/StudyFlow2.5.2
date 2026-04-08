import { GoogleGenAI } from "@google/genai";

// @ts-ignore
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

export async function generateStudyPlan(subject: string, topics: string[]) {
  const prompt = `Create a detailed study plan for the subject "${subject}" covering these topics: ${topics.join(", ")}. 
  Provide specific focus areas, estimated time per topic, and a suggested resource type (video, reading, practice).
  Format the response in Markdown.`;

  const result = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text;
}

export async function analyzeWeakAreas(logs: any[]) {
  const prompt = `Analyze these study logs and identify weak areas: ${JSON.stringify(logs)}.
  Provide actionable advice on how to improve in these areas.
  Format the response in Markdown.`;

  const result = await genAI.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text;
}

// Support for streaming
export async function* streamStudyAdvice(topic: string) {
  const prompt = `Provide quick, actionable study advice for the topic: "${topic}". 
  Keep it concise and encouraging. Format in Markdown.`;

  const result = await genAI.models.generateContentStream({
    model: "gemini-1.5-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
}

export { genAI };
