// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormState } from '../components/FormContext';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const fieldOrder = ['name', 'email', 'linkedin', 'aiIdea'] as const;

function extractField(content: string, key: string): string {
  const regex = new RegExp(`${key}\\s*[:\\-]?\\s*(.*)`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim() || '';
}

export async function callGeminiAPI(messages: { role: string; parts: string }[], form: FormState): Promise<string> {
  try {
    const chat = await model.startChat({
      history: messages.map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: m.parts }],
      })),
      generationConfig: { temperature: 0.7 },
    });

    const prompt = `
You're an AI Copilot helping fill a job application form.
Extract only what's new from user input. Current values are:

Name: ${form.name || '[empty]'}
Email: ${form.email || '[empty]'}
LinkedIn: ${form.linkedin || '[empty]'}
AI Idea: ${form.aiIdea || '[empty]'}

If the form is fully filled, respond with a summary like:
"Here's what I got:
- Name: ...
- Email: ...
- LinkedIn: ...
- AI Idea: ...
Let me know if you'd like to edit anything."

If it's incomplete, ask only the missing fields.
`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response.text();

    if (!response) return 'Sorry, I didn’t catch that. Can you try again?';

    return response;
  } catch (err) {
    console.error('Gemini API error:', err);
    return 'Sorry, something went wrong while processing your input.';
  }
}
