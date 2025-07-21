import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is missing from environment variables.');
}

const SYSTEM_PROMPT = `You are a helpful assistant helping the user fill out a form with 4 fields:
- name (just their first name, e.g. "Bhasker")
- email
- linkedin (a full LinkedIn URL)
- aiIdea (a short sentence idea for an AI agent)

Extract any fields the user mentions in plain language and return them.`;

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

export async function callGeminiAPI(chatHistory: ChatMessage[]): Promise<Partial<{
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
}>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const formattedMessages = chatHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const result = await model.generateContent([
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    ...formattedMessages,
  ]);

  const text = result.response.text();

  // Simple regex extraction
  const extract = (label: string, regex: RegExp) => {
    const match = text.match(regex);
    return match?.[1]?.trim() || '';
  };

  return {
    name: extract('name', /(?:name\s*[:\-]?\s*)([A-Z][a-z]+)\b/),
    email: extract('email', /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/),
    linkedin: extract('linkedin', /(https?:\/\/(www\.)?linkedin\.com\/[^\s]+)/i),
    aiIdea: extract('idea', /(?:idea\s*[:\-]?\s*)(.+)/i),
  };
}
