// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const callGeminiAPI = async (messages: { role: 'user' | 'assistant'; parts: string }[]) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...formattedMessages,
    ],
  });

  const response = await result.response.text();

  return extractFormData(response);
};

const SYSTEM_PROMPT = `
You're an AI copilot that helps users fill out a form with the following fields:
- Name
- Email
- LinkedIn Profile
- AI Agent Idea

From the conversation history, extract only the updated field values in JSON like:
{ "name": "John Doe", "email": "john@example.com", "linkedin": "https://linkedin.com/in/johndoe", "aiIdea": "An AI that generates marketing content." }

If the user is reviewing or editing, update the fields accordingly.
`;

function extractFormData(text: string): Partial<{
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
}> {
  try {
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to extract JSON:', e);
  }
  return {};
}
