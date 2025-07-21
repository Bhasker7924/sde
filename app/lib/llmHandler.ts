import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FormData } from '../components/FormContext'; // Make sure FormData is exported

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are a helpful assistant designed to extract four fields from user input:
- name
- email
- linkedin
- aiIdea

Use this JSON format only:
{
  "name": "",
  "email": "",
  "linkedin": "",
  "aiIdea": ""
}
Only update fields the user explicitly mentions.
`;

function extractFieldsFromResponse(text: string): Partial<FormData> {
  try {
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) return {};
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: parsed.name || '',
      email: parsed.email || '',
      linkedin: parsed.linkedin || '',
      aiIdea: parsed.aiIdea || '',
    };
  } catch (err) {
    console.error('Error parsing Gemini output:', err);
    return {};
  }
}

type ChatMessage = {
  role: 'user' | 'assistant';
  parts: string;
};

export async function callGeminiAPI(
  messages: ChatMessage[]
): Promise<Partial<FormData>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const formattedMessages = messages.map((msg) => ({
      parts: [msg.parts], // Gemini expects array of strings
    }));

    const result = await model.generateContent([
      { role: 'user', parts: [SYSTEM_PROMPT] },
      ...formattedMessages,
    ]);

    const response = await result.response.text();
    return extractFieldsFromResponse(response);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {};
  }
}
