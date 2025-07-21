import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage } from "@/types";

// ✅ FIX: Get API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function callGeminiAPI(chatHistory: ChatMessage[]) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is missing from environment variables.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent({
    contents: chatHistory.map((msg) => ({ role: msg.role, parts: [msg.parts] })),
    generationConfig: {
      temperature: 0.6,
    },
  });

  const response = await result.response;
  const text = await response.text();

  // Try to parse key-value pairs from Gemini's response
  const updates: Partial<Record<"name" | "email" | "linkedin" | "aiIdea", string>> = {};

  const lower = text.toLowerCase();

  const nameMatch = text.match(/name[:\-\s]+([a-zA-Z ]{2,})/i);
  if (nameMatch) updates.name = nameMatch[1].trim();

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) updates.email = emailMatch[0].trim();

  const linkedinMatch = text.match(/https?:\/\/[\w./-]*linkedin\.com\/[\w./-]+/);
  if (linkedinMatch) updates.linkedin = linkedinMatch[0].trim();

  const ideaMatch = text.match(/idea[:\-\s]+([\s\S]+)/i);
  if (ideaMatch) updates.aiIdea = ideaMatch[1].trim();

  return updates;
}
