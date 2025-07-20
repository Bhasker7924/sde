import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure of the LLM's parsed JSON response
// This matches the format you're prompting the AI to return.
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
// This check runs when the serverless function is initialized (cold start)
if (!process.env.GOOGLE_API_KEY) {
  // Use a generic error message as this might happen during build or runtime init
  throw new Error('❌ GOOGLE_API_KEY is missing from environment variables. Set it in Vercel settings.');
}

// Log API key status (FIXED TYPO HERE)
console.log(
  '🚀 API key Status:',
  process.env.GOOGLE_API_KEY ? 'Key is present and has value' : 'Key is missing or empty'
);

// Initialize Gemini Generative AI client
// Use a fallback empty string for type safety, though the check above should prevent it from being truly empty.
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
    // Ensure the last message (user's latest input) is correctly formatted.
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini typically uses 'user'/'model' roles
      parts: [{ text: msg.content }],
    }));

    // Add the system instruction for the AI (as the first 'user' entry in the conversation context)
    // This is crucial for guiding the model's behavior and output format.
    const systemInstruction = {
        role: 'user', // System instructions are often put as a 'user' message followed by model's understanding
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


    // Get the Generative Model instance (using Flash as intended)
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash-latest', // Use the Flash model
    });

    // Send the system instruction followed by the actual conversation history
    const result = await model.generateContent({
      contents: [systemInstruction, ...contents],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json", // <-- ADDED THIS LINE FOR STRICT JSON OUTPUT
      },
    });

    // Extract the raw text response from Gemini
    // With responseMimeType: "application/json", this should now *always* be valid JSON
    // or an error will be thrown by the API call itself.
    const rawReplyText = result.response.text();

    // --- Safely Parse JSON Response from LLM ---
    // The markdown extraction logic is now less critical but harmless to keep,
    // in case the model sometimes deviates despite mimeType (unlikely but safe).
    let jsonString = rawReplyText;
    const jsonMatch = rawReplyText.match(/```json\n([\s\S]*?)\n```/);

    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    } else {
      // This warning should now ideally not appear if responseMimeType is working.
      console.warn("Gemini response not wrapped in ```json``` (despite mimeType), attempting to parse as is:", rawReplyText);
    }

    let parsedData: ParsedLLMResponse = {
      message: "An unexpected response was received from the AI.",
      updates: {}
    };

    try {
      parsedData = JSON.parse(jsonString || '{}');

      if (!parsedData.message) {
        parsedData.message = "AI response received, but message field was empty.";
      }

    } catch (parseError: any) {
      // This catch should ideally not be hit with responseMimeType: "application/json"
      // unless the model sends empty response or some other very malformed output.
      console.error('❌ Failed to parse final JSON string:', jsonString, parseError);
      parsedData.message = "I'm having trouble understanding the AI's format. Please try again.";
      parsedData.updates = {};
    }

    // --- Return Response in Frontend Expected Format ---
    return NextResponse.json({
      message: parsedData.message,
      updates: parsedData.updates || {},
    });

  } catch (err: any) {
    console.error('🔥 Gemini API or Server Error:', err.message || err);

    // If responseMimeType: "application/json" causes the API to throw an error,
    // that error will be caught here. Check `err.message` for details.
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
