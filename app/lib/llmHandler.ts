import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormData } from '../components/FormContext';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `
You are a helpful assistant designed to extract four fields from user input:
- name
- email
- linkedin
- aiIdea (a creative AI project idea)

Use the following JSON format only:
{
  "name": "",
  "email": "",
  "linkedin": "",
  "aiIdea": ""
}

Only update the fields that are mentioned by the user. Do NOT fill fields the user didn’t talk about.
Avoid any extra explanations or text.
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
  messages: { role: 'user' | 'assistant'; parts: string }[]
): Promise<Partial<FormData>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent([
      { role: 'system', parts: SYSTEM_PROMPT },
      ...messages,
    ]);

    const response = await result.response.text();
    return extractFieldsFromResponse(response);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {};
  }
}
