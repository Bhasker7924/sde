import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormData } from '../components/FormContext';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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

export async function callGeminiAPI(
  messages: { role: 'user' | 'model'; parts: string }[]
): Promise<Partial<FormData>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Properly format each message to fit Content[]
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    // Now prepend the system prompt as a user message
    const chatHistory = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...formattedMessages,
    ];

    const result = await model.generateContent(chatHistory);
    const response = await result.response.text();

    return extractFieldsFromResponse(response);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {};
  }
}
