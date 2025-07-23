// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('❌ GOOGLE_API_KEY is required in .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = 'gemini-2.5-flash-lite-preview-06-17';
const FORM_FIELDS = ['name', 'email', 'linkedin', 'aiIdea'] as const;

type FormState = {
  name?: string;
  email?: string;
  linkedin?: string;
  aiIdea?: string;
};

export async function getLLMResponse(
  conversation: Content[],
  currentForm: FormState
) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const systemPrompt = `
You are a helpful Copilot. The form fields are ${FORM_FIELDS.join(', ')}.
Current filled fields: ${JSON.stringify(currentForm)}.
Only ask for one missing field at a time in natural language.
Validate email format and LinkedIn URL format. Always return JSON:
{
 "message": "...",
 "updates": { <field>: "<value>" }
}
`;

    const contents: Content[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversation,
    ];

    const resp = await model.generateContent({ contents, generationConfig: { maxOutputTokens: 256 } });
    const text = resp.response.text().trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
      if (!parsed.message || typeof parsed.updates !== 'object') throw new Error();
    } catch {
      console.error('Invalid JSON from Gemini:', text);
      return {
        message: "Sorry, I didn't understand that. Could you rephrase?",
        updates: {},
      };
    }

    // Validate email if updated
    if (parsed.updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.updates.email)) {
      return { message: "That doesn't look like a valid email. Try again.", updates: {} };
    }

    // Validate LinkedIn if updated
    if (parsed.updates.linkedin && !parsed.updates.linkedin.startsWith('http')) {
      return { message: "Please provide a valid LinkedIn URL (starting with https://).", updates: {} };
    }

    return parsed;
  } catch (err: any) {
    console.error('Gemini API error:', err);
    return {
      message: "Oops, something went wrong. Try again in a moment.",
      updates: {},
    };
  }
}