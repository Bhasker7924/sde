// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import type { Content } from '@google/generative-ai';

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
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('Missing GOOGLE_API_KEY environment variable. Please set it in your .env.local file.');
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL = 'gemini-2.5-flash-lite-preview-06-17';

// --- End of Initialization ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, formData } = body;

    // Basic input validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid messages array.", updates: {} }, { status: 400 });
    }
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ message: "Invalid formData object.", updates: {} }, { status: 400 });
    }

    // Map incoming messages to the Content type required by GoogleGenerativeAI
    const contents: Content[] = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model', // Ensure roles are 'user' or 'model'
      parts: [{ text: msg.content }],
    }));

    // --- Core System Instruction for the LLM's behavior ---
    const systemInstruction: Content = {
      role: 'user', // System instructions are often provided as an initial user turn
      parts: [
        {
          text: `You are a friendly AI Copilot guiding a user through a form with four distinct states: **Collecting**, **Reviewing**, and **Submitting**.

**Required Fields (in this exact order for collection):**
1.  **name**
2.  **email**
3.  **linkedin** (URL)
4.  **idea** (AI Agent Idea)

**Current Form State:**
${JSON.stringify(formData)}

---

**Your Task & State Machine Logic:**

**1. Collecting State:**
   - **Trigger:** Any of the four required fields (name, email, linkedin, idea) are empty in the 'Current Form State'.
   - **Action:**
     - **First, attempt to extract *any* valid and relevant field data from the user's input, regardless of which field you just asked for.** Update your internal understanding of the formData based on this.
     - Your 'message' MUST then ask for the *next single missing field* in the specified order after updating any fields.
     - **Input Validation:**
       - **Email:** If the user provides an email, check if it looks like a valid email format (e.g., contains '@' and at least one '.' after '@'). If not, politely state the issue and ask for a valid email *again*.
       - **LinkedIn URL:** If the user provides a LinkedIn URL, check if it starts with 'http://' or 'https://'. If not, politely state the issue and ask for a valid LinkedIn URL *again*.
     - Once valid information for a field is extracted, provide a brief, positive confirmation and then immediately ask for the *next missing field* in the sequence.
     - **Crucially: In the 'updates' object, include all fields that were successfully collected/updated in the current turn.**

**2. Reviewing State:**
   - **Trigger:** ALL four fields (name, email, linkedin, idea) are filled in the 'Current Form State'.
   - **Action:**
     - Your 'message' MUST present a clear, bulleted summary of *all* the collected data. Do NOT use bold (**) for the field names in the summary to avoid rendering issues if the frontend doesn't expect it.
     - **Example:**
       \`\`\`
       Great, I have all your details! Please take a moment to review them:
       - Name: John Doe
       - Email: john.doe@example.com
       - LinkedIn: https://linkedin.com/in/john-doe
       - AI Idea: An AI agent for automated unit test generation.
       Does everything look correct? Or would you like to change anything?
       \`\`\`
     - If the user indicates a desire to edit a specific field, identify the field, include *only* that specific update in your 'updates' object. Then, re-enter the Reviewing State by presenting the *updated summary* again. Do NOT ask for the next field if an edit occurs; always re-present the full review.
     - **Crucially: The 'updates' object in this state should always contain *all four current formData values* to ensure the frontend form fields are fully synchronized with the AI's understanding.**

**3. Submitting State:**
   - **Trigger:** You are currently in the 'Reviewing State' AND the user explicitly confirms the details are correct (e.g., "looks good", "submit", "yes, please submit", "all correct", "go ahead"). You should be flexible in recognizing common affirmations.
   - **Action:**
     - Your 'message' should be a final confirmation like: "Perfect! Submitting your information now. Thank you!"
     - Your JSON response MUST include the flag **"isSubmissionReady": true**. This signals the UI to automatically submit the form.
     - **Crucially: The 'updates' object should be an empty object \`{}\` in this state, as no further form updates are expected from the AI.**

---

**Output Format:**
Always return a valid JSON object. Do NOT include any other text, explanations, or markdown outside the JSON block.

\`\`\`json
{
  "message": "A conversational message to the user.",
  "updates": {
    "name": "Updated Name",
    "email": "updated@example.com",
    "linkedin": "updated_linkedin_url",
    "idea": "updated_ai_idea"
  },
  "isSubmissionReady": false
}
\`\`\`
`,
        },
      ],
    };

    const model = genAI.getGenerativeModel({
      model: MODEL,
    });

    // Generate content using the system instruction and conversation history
    const result = await model.generateContent({
      contents: [systemInstruction, ...contents],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json", // Crucial for instructing JSON output
      },
    });

    const rawReplyText = result.response.text();
    let parsedData: ParsedLLMResponse;

    try {
      // FIX: Clean the LLM response by removing markdown code block delimiters if present.
      // This handles cases where the LLM might wrap its JSON in ```json...```
      const cleanedReplyText = rawReplyText
        .replace(/^```json\s*/, '') // Remove '```json' at the start
        .replace(/\s*```$/, '')     // Remove '```' at the end
        .trim();                    // Trim any leftover whitespace

      parsedData = JSON.parse(cleanedReplyText);

      // FIX: Validate the structure of the parsed response.
      // 'message' is always required.
      if (typeof parsedData.message !== 'string') {
        throw new Error('LLM response missing "message" string.');
      }

      // 'updates' is expected to be an object. If isSubmissionReady is true,
      // the LLM might omit 'updates', so we ensure it's an empty object for consistency.
      if (parsedData.isSubmissionReady) {
        parsedData.updates = {}; // Force empty updates object on submission
      } else if (typeof parsedData.updates !== 'object') {
          // If not submitting and updates is not an object, it's an invalid structure.
          throw new Error('LLM response missing or invalid "updates" object when not submitting.');
      }

    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Gemini or invalid structure:', rawReplyText, parseError);
      return NextResponse.json({
        message: "I'm having a little trouble understanding my own thoughts right now. Could you please rephrase that?",
        updates: {}, // Return empty updates to prevent frontend errors
      }, { status: 500 }); // 500 status for internal AI response parsing/validation error
    }

    // Return the parsed data including message, updates, and submission readiness
    return NextResponse.json({
      message: parsedData.message || "...", // Fallback message
      updates: parsedData.updates || {},   // Ensure updates is always an object
      isSubmissionReady: parsedData.isSubmissionReady || false, // Default to false
    });

  } catch (err: any) {
    // Catch any other errors from the Gemini API or server
    console.error('🔥 Gemini API or Server Error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
        message: "Sorry, I'm having trouble connecting to the AI. Please try again in a moment.",
        updates: {}, // Return empty updates on major error
      },
      { status: 500 }
    );
  }
  }
