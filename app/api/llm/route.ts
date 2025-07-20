import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure of the LLM's parsed JSON response
type ParsedLLMResponse = {
  message: string;
  updates: {
    name?: string;
    email?: string;
    linkedin?: string;
    idea?: string;
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

    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const systemInstruction = {
      role: 'user',
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
    };

    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash-latest',
    });

    const result = await model.generateContent({
      contents: [systemInstruction, ...contents],
      generationConfig: {
        temperature: 0.7,
      },
    });

    const rawReplyText = result.response.text();

    // --- NEW LOGIC: Extract JSON from Markdown Code Block ---
    let jsonString = rawReplyText;
    const jsonMatch = rawReplyText.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      // If a markdown JSON block is found, use its content
      jsonString = jsonMatch[1];
    } else {
      // If not, it might be raw JSON or something else.
      // Log for debugging if it's not wrapped, to see what format it is.
      console.warn("Gemini response not wrapped in ```json```, attempting to parse as is:", rawReplyText);
    }
    // --- END NEW LOGIC ---

    let parsedData: ParsedLLMResponse = {
      message: "An unexpected response was received from the AI.",
      updates: {}
    };

    try {
      // Attempt to parse the extracted JSON string
      parsedData = JSON.parse(jsonString || '{}');

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
