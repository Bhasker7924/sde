// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Add the optional 'isSubmissionReady' flag to the response type
type ParsedLLMResponse = {
  message: string;
  updates: {
    name?: string;
    email?: string;
    linkedin?: string;
    idea?: string;
  };
  isSubmissionReady?: boolean; // New flag to signal form submission
};

// --- API Key Check and genAI Initialization ---
// Ensure you have your API key set as an environment variable (e.g., GOOGLE_API_KEY)
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);
// --- End of Initialization ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, formData } = body;

    // ... (Input validation for messages and formData remains the same) ...
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid messages array.", updates: {} }, { status: 400 });
    }
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ message: "Invalid formData object.", updates: {} }, { status: 400 });
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // --- Updated System Prompt with Review and Submit Logic ---
    const systemInstruction = {
        role: 'user',
        parts: [
          {
            text: `You are a friendly AI Copilot guiding a user through a form with four states: Collecting, Reviewing, and Submitting.
The required fields are, in this exact order: name, email, linkedin, idea.

**Current Form State:**
${JSON.stringify(formData)}

**Your Task & State Machine:**

**1. Collecting State:**
- If any of the four fields are empty in the 'Current Form State', you are in the 'Collecting' state.
- Your goal is to ask for the *next single missing field* in the sequence.
- Validate the user's input. If invalid (e.g., bad email), politely ask again for the same field.
- Once you extract valid information, provide a brief confirmation and ask for the next field.

**2. Reviewing State:**
- **TRIGGER:** You enter this state ONLY when all four fields (name, email, linkedin, idea) are filled.
- **ACTION:** Your 'message' MUST present a summary of all the collected data clearly. Use markdown for formatting. For example:
  "Great, I have all your details! Please take a moment to review them:
  - **Name**: Priya Sharma
  - **Email**: priya.sharma@email.com
  - **LinkedIn**: https://linkedin.com/in/priya-sharma
  - **AI Idea**: An AI agent for automated unit test generation.
  Does everything look correct? Or would you like to change anything?"
- If the user wants to edit a field (e.g., "my email is wrong"), update the field in your 'updates' object and then **return to the Reviewing State** by presenting the updated summary again.

**3. Submitting State:**
- **TRIGGER:** You enter this state ONLY IF you are in the 'Reviewing State' AND the user confirms the details are correct (e.g., "looks good", "yes", "submit it").
- **ACTION:**
  - Your 'message' should be a final confirmation like "Perfect! Submitting your information now. Thank you!"
  - Your JSON response MUST include the flag **"isSubmissionReady": true**.

**Output Format:**
Always return a valid JSON object.
{
  "message": "...",
  "updates": { "fieldName": "newValue" },
  "isSubmissionReady": boolean // This MUST be true only in the Submitting State.
}
`,
          },
        ],
      };
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });

    const result = await model.generateContent({
      contents: [systemInstruction, ...contents],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    });

    const rawReplyText = result.response.text();
    let parsedData: ParsedLLMResponse;

    try {
        parsedData = JSON.parse(rawReplyText);
    } catch (parseError) {
        console.error('❌ Failed to parse JSON from Gemini:', rawReplyText, parseError);
        return NextResponse.json({
            message: "I'm having a little trouble with my thoughts right now. Could you please rephrase that?",
            updates: {},
        });
    }

    return NextResponse.json({
      message: parsedData.message || "...",
      updates: parsedData.updates || {},
      isSubmissionReady: parsedData.isSubmissionReady || false,
    });


  } catch (err: any) {
    console.error('🔥 Gemini API or Server Error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
        message: "Sorry, I'm having trouble connecting to the AI. Please try again in a moment.",
        updates: {},
      },
      { status: 500 }
    );
  }
}