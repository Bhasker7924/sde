import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormData } from '../components/FormContext';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are a helpful assistant that helps users fill out a form with the following fields:
- Name
- Email
- LinkedIn
- AI Idea

Extract structured data from user input and return only the updated fields.
`;

export async function callGeminiAPI(
  messages: { role: 'user' | 'model'; parts: string }[]
): Promise<Partial<FormData>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const chatHistory = [
    { text: SYSTEM_PROMPT },
    ...messages.map((msg) => ({ text: msg.parts }))
  ];

  const result = await model.generateContent(chatHistory);
  const response = await result.response.text();

  return extractFieldsFromResponse(response);
}

function extractFieldsFromResponse(response: string): Partial<FormData> {
  const updates: Partial<FormData> = {};
  const lines = response.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (line.toLowerCase().startsWith('name:')) {
      updates.name = line.split(':')[1].trim();
    } else if (line.toLowerCase().startsWith('email:')) {
      updates.email = line.split(':')[1].trim();
    } else if (line.toLowerCase().startsWith('linkedin:')) {
      updates.linkedin = line.split(':')[1].trim();
    } else if (line.toLowerCase().startsWith('idea:')) {
      updates.aiIdea = line.split(':')[1].trim();
    }
  }

  return updates;
}
