import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormData } from '../components/FormContext';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function callGeminiAPI(
  messages: { role: 'user' | 'model'; parts: string }[]
): Promise<Partial<FormData> & { response?: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const chat = model.startChat({ history: messages });

    const userMessage = messages[messages.length - 1]?.parts || 'Tell me about yourself';
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    const extracted: Partial<FormData> = {};

    const extract = (label: keyof FormData, regex: RegExp) => {
      const match = reply.match(regex);
      if (match) extracted[label] = match[1].trim();
    };

    extract('name', /(?:Name|name)\s*[:\-–]\s*(.+)/i);
    extract('email', /(?:Email|email)\s*[:\-–]\s*([\w.-]+@[\w.-]+\.\w+)/i);
    extract('linkedin', /(?:LinkedIn|linkedin)\s*[:\-–]\s*(https?:\/\/[^\s]+)/i);
    extract('aiIdea', /(?:Idea|AI Idea|ai idea)\s*[:\-–]\s*(.+)/i);

    return { ...extracted, response: reply };
  } catch (err) {
    console.error('Gemini API Error:', err);
    return { response: 'Sorry, something went wrong.' };
  }
}
