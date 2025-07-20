// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerateContentRequest } from '@google/generative-ai'; // For type hinting
import type { Content } from '@google/generative-ai'; // For message history type

// Use GOOGLE_API_KEY as per your previous route.ts and Vercel setup
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('❌ GOOGLE_API_KEY is missing from environment variables. Set it in Vercel settings.');
}

// Initialize Gemini Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function getLLMResponse(conversation: Content[]) {
  try{
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }); // <-- Change model here
// ...
    // Construct the request payload for Gemini
    const contents: GenerateContentRequest['contents'] = [
      {
        role: 'system', // Gemini uses 'system' for initial instructions for some models or setups, though 'user' is often used for prompts.
        parts: [
          {
            text: `You are a smart and friendly AI Copilot helping users fill out a form with these 4 fields:
- name
- email
- LinkedIn
- AI idea

Extract values directly from conversation. If the user says "Hi this is Priya", extract name: "Priya". Only enter the value, not the entire sentence. 
Reply naturally but only once with things like "Nice to meet you."
Always return JSON format:
{
  "message": "Thanks! What's your email?",
  "updates": {
    "name": "Priya"
  }
}
Only include updated fields inside 'updates'. If none, return empty updates. Do not repeat fields. Always return valid JSON.`,
          },
        ],
      },
      ...conversation, // Spread the existing conversation history
    ];

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        // You might consider responseMimeType: "application/json" for stricter JSON output
        // but it requires a Gemini 1.5 model and careful schema definition.
        // For simpler cases, prompting for JSON is often sufficient.
      },
    });

    const responseText = result.response.text();

    // Safely parse JSON string from LLM
    try {
      return JSON.parse(responseText || '{}');
    } catch (err) {
      console.error('❌ Failed to parse response as JSON from Gemini:', responseText);
      return {
        message: "Hmm, I had trouble understanding that. Could you say it again?",
        updates: {},
      };
    }
  } catch (err: any) {
    console.error('🔥 Gemini API error:', err.message || err);

    return {
      message: "Sorry, I'm having trouble connecting to the AI. Try again in a moment!",
      updates: {},
    };
  }
}
