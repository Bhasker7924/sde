// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import type { Content } from '@google/generative-ai';

type ParsedLLMResponse = {
  message: string;
  updates: {
    name?: string;
    email?: string;
    linkedin?: string;
    idea?: string;
  };
  isSubmissionReady?: boolean; 
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

   
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid messages array.", updates: {} }, { status: 400 });
    }
    if (!formData || typeof formData !== 'object') {
      return NextResponse.json({ message: "Invalid formData object.", updates: {} }, { status: 400 });
    }

    // Map incoming messages to the Content type required by GoogleGenerativeAI
    const contents: Content[] = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model', 
      parts: [{ text: msg.content }],
    }));

    // --- Core System Instruction for the LLM's behavior ---
    const systemInstruction: Content = {
      role: 'user', // System instructions are often provided as an initial user turn
      parts: [
        {
          text: `You are a friendly AI Copilot guiding a user through a form with four distinct states: **Collecting**, **Reviewing**, and **Submitting**.

**Required Fields (in this exact order for collection, be flexible in extraction):**
1.  **name** (Standard text string representing a person's name. Crucially, do NOT assign any text containing '@' or 'http'/'https' to this field. Can also be inferred from a LinkedIn URL if present, but prioritize explicit name inputs.)
2.  **email** (Must be a valid email format. It must contain exactly one '@' symbol and have at least one '.' character after the '@' symbol. Extract the precise email string only.)
3.  **linkedin** (Must be a valid URL, commonly starting with 'http://' or 'https://'. Do not be overly strict about characters immediately following 'https://' as long as it forms a valid URL structure.)
4.  **idea** (AI Agent Idea - free text. Be flexible in identifying and extracting this, even from conversational responses like "My idea is..." or "I want to create an AI that...")

**Current Form State (crucially, any field that is empty or null needs to be collected):**
${JSON.stringify(formData)}

---

**Your Task & State Machine Logic:**

**1. Collecting State:**
   - **Trigger:** Any of the four required fields (name, email, linkedin, idea) are empty or null in the 'Current Form State'.
   - **Action:**
     - **Critically: First, thoroughly analyze the user's current input to extract *ALL* possible valid and relevant field data. Prioritize assigning values to their correct field types (email to email, URL to LinkedIn). If a name is explicitly given, use that. If a LinkedIn URL is provided and no name is set, attempt to infer a name from the LinkedIn URL's path (e.g., from "/in/john-doe" extract "John Doe").**
     - **For the 'name' field: ensure it does not contain '@' or 'http'. If the input contains these, it must be assigned to 'email' or 'linkedin' respectively, not 'name'.**
     - **For the 'email' field: Focus strictly on extracting the exact email string (e.g., "example@domain.com") from the user's input, ignoring surrounding conversational text. Then, validate this extracted string.**
     - **For the 'idea' field, look for the full-text description provided by the user. If the user's message contains a lengthy description that could be an AI agent idea, extract it and place it in the 'idea' field.**
     - Update your internal understanding of the formData with these extracted values.
     - Your 'message' MUST then politely ask for the *next single field that is still missing or null* from the 'Current Form State' (following the name, email, linkedin, idea order). Do not ask for fields that are already populated or if a previously provided value for that field is now valid.
     - **Input Validation (and re-prompt if invalid):**
       - **Email:** If the *extracted email string* does NOT contain exactly one '@' symbol and does NOT have at least one '.' character after the '@' symbol, politely state "That doesn't look like a valid email. Could you please provide a correct email address?" and *only* ask for the email again.
       - **LinkedIn URL:** If the user provides a LinkedIn URL, verify it is a general valid URL. If invalid, politely state "That doesn't look like a valid LinkedIn URL. Please provide a URL starting with http:// or https://, for example." and *only* ask for the LinkedIn URL again.
     - Once valid information for a field is extracted and assigned, provide a brief, positive confirmation if appropriate, and then immediately ask for the *next remaining missing field*.
     - **Crucially: In the 'updates' object, include *all* fields that were successfully collected or updated from the user's latest input, even if multiple fields were provided in one message, and ensure the value is correctly assigned to the *right* field.**

**2. Reviewing State:**
   - **Trigger:** ALL four fields (name, email, linkedin, idea) are filled (not empty or null) in the 'Current Form State'.
   - **Action:**
     - Your 'message' MUST present a clear, bulleted summary of *all* the collected data. Do NOT use bold (**) for the field names in the summary.
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
     - **Crucially: The 'updates' object in this state should always contain *all four current formData values* to ensure the frontend form fields are fully synchronized with the AI's understanding, even if no changes were made.**

**3. Submitting State:**
   - **Trigger:** You are currently in the 'Reviewing State' AND the user explicitly confirms the details are correct (e.g., "looks good", "submit", "yes, please submit", "all correct", "go ahead", "confirm"). You should be flexible in recognizing common affirmations.
   - **Action:**
     - Your 'message' should be a final confirmation like: "Perfect! Submitting your information now. Thank you!"
     - Your JSON response MUST include the flag **"isSubmissionReady": true"**. This signals the UI to automatically submit the form.
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
      const cleanedReplyText = rawReplyText
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      parsedData = JSON.parse(cleanedReplyText);

      if (typeof parsedData.message !== 'string') {
        throw new Error('LLM response missing "message" string.');
      }

      if (parsedData.isSubmissionReady) {
        parsedData.updates = {};
      } else if (typeof parsedData.updates !== 'object') {
          throw new Error('LLM response missing or invalid "updates" object when not submitting.');
      }

    } catch (parseError) {
      console.error('❌ Failed to parse JSON from Gemini or invalid structure:', rawReplyText, parseError);
      return NextResponse.json({
        message: "I'm having a little trouble understanding my own thoughts right now. Could you please rephrase that?",
        updates: {},
      }, { status: 500 });
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
