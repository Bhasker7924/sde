// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure of the LLM's parsed JSON response
type ParsedLLMResponse = {
  message: string;
  updates: {
    name?: string;
    email?: string;
    linkedin?: string; // Expect lowercase 'l'
    aiIdea?: string;   // Expect camelCase 'aiIdea'
  };
};

// --- API Key Check and Initialization ---
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('❌ GOOGLE_API_KEY is missing from environment variables. Set it in Vercel settings.');
}

console.log(
  '🚀 API key Status:',
  process.env.GOOGLE_API_KEY ? 'Key is present and has value' : 'Key is missing or empty'
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// --- POST Request Handler ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    // Convert OpenAI-style messages to Gemini-style contents
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add the system instruction for the AI, guiding its behavior and output format.
    const systemInstruction = {
        role: 'user',
        parts: [
          {
            text: `You are a smart and friendly AI Copilot helping users fill out a form with these 4 fields:
- name
- email
- linkedin (as 'linkedin')
- AI idea (as 'aiIdea')

**Your primary goal is to extract these 4 pieces of information.**
Extract values directly from conversation. If the user says "Hi this is Priya", extract name: "Priya". Only enter the value, not the entire sentence.
Only ask for one piece of missing information at a time. If you have extracted all 4 fields, your 'message' should confirm completion and offer a next step, like "Great! I have all your details. Is there anything else I can help with?" or "Thanks for providing all the information!". Do NOT ask for already collected information again in the message.

Always return JSON format:
{
  "message": "...", // The conversational reply
  "updates": { // Only include updated fields here. If no new updates, this should be empty.
    "name": "Priya",
    "email": "priya@example.com",
    "linkedin": "https://linkedin.com/in/priya",
    "aiIdea": "A system for personalized learning paths"
  }
}
Always return valid JSON.`,
          },
        ],
      };


    const model = genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash-lite-preview-06-17',
    });

    const result = await model.generateContent({
      contents: [systemInstruction, ...contents],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json", // Still request strict JSON output
      },
    });

    const rawReplyText = result.response.text();

    // Reverting to robust parsing that handles both pure JSON and JSON wrapped in markdown
    let jsonString = rawReplyText;
    const jsonMatch = rawReplyText.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    } else {
      // This warning will reappear, but it indicates the fallback is in use, which is necessary.
      console.warn("Gemini response not wrapped in ```json``` (despite mimeType), attempting to parse as is:", rawReplyText);
    }

    let parsedData: ParsedLLMResponse = {
      message: "An unexpected response was received from the AI.",
      updates: {}
    };

    try {
      parsedData = JSON.parse(jsonString || '{}'); // Parse the potentially extracted string

      if (!parsedData.message) {
        parsedData.message = "AI response received, but message field was empty.";
      }

    } catch (parseError: any) {
      console.error('❌ Failed to parse final JSON string:', jsonString, parseError);
      parsedData.message = "I'm having trouble understanding the AI's format. Please try again.";
      parsedData.updates = {};
    }

    return NextResponse.json({
      message: parsedData.message,
      updates: parsedData.updates || {},
    });

  } catch (err: any) {
    console.error('🔥 Gemini API or Server Error:', err.message || err);

    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
        message: "Sorry, I'm having trouble connecting to the AI. Please try again in a moment!",
        updates: {},
      },
      { status: 500 }
    );
  }
}
