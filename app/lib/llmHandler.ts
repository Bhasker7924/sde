// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('❌ GOOGLE_API_KEY is required in .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = 'gemini-2.5-flash-lite-preview-06-17';

// IMPORTANT: Ensure these match the keys in your FormData type in FormContext.tsx
const FORM_FIELDS = ['name', 'email', 'linkedin', 'idea'] as const;

type FormState = {
  name?: string;
  email?: string;
  linkedin?: string;
  idea?: string; // Consistent with FormData
};

export async function getLLMResponse(
  conversation: Content[],
  currentForm: FormState
) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    let nextQuestion = '';
    let currentFieldToAskFor: keyof FormState | undefined;

    // Logic for the next question based on missing fields
    if (!currentForm.name) {
      currentFieldToAskFor = 'name';
      nextQuestion = "Hi! I'm here to help you submit your AI agent idea. Let's start with the basics - what's your name?";
    } else if (!currentForm.email) {
      currentFieldToAskFor = 'email';
      nextQuestion = `Thanks, ${currentForm.name}! What's your contact email for this idea?`;
    } else if (!currentForm.linkedin) {
      currentFieldToAskFor = 'linkedin';
      nextQuestion = `Got your email. Could you provide your LinkedIn profile URL? (e.g., https://linkedin.com/in/yourprofile)`;
    } else if (!currentForm.idea) {
      currentFieldToAskFor = 'idea';
      nextQuestion = "Thanks for the LinkedIn! Now, please describe your AI agent idea in a few sentences.";
    }

    const systemPrompt = {
        role: 'user', // System instructions for Gemini 1.5 flash are best given by the 'user' role
        parts: [
          {
            text: `You are an AI Agent Idea Submission Assistant.
The required fields for the AI agent idea submission are: Your Name (name), Contact Email (email), Your LinkedIn Profile (linkedin), and AI Agent Idea Description (idea).

**Current Submission Details:**
${JSON.stringify(currentForm, null, 2)}

**Your Task & State Machine:**

**1. Collecting State:**
- If any of the four fields (name, email, linkedin, idea) are empty in 'Current Submission Details', you are in the 'Collecting' state.
- Your goal is to ask for the *next single missing field* based on the following sequence:
    1.  **Your Name (name)**
    2.  **Contact Email (email)**
    3.  **Your LinkedIn Profile (linkedin)**
    4.  **AI Agent Idea Description (idea)**
- Validate the user's input for email and LinkedIn. If invalid, politely ask again for the same field.
- Once you extract valid information, provide a brief confirmation and then ask for the next field.

**2. Reviewing State:**
- **TRIGGER:** You enter this state ONLY when all four fields (name, email, linkedin, idea) are filled.
- **ACTION:** Your 'message' MUST present a summary of all the collected data clearly. For example:
  "Great, I have all your details! Please take a moment to review them:
  ---
  **Your Name**: ${currentForm.name || '[Name]'}
  **Contact Email**: ${currentForm.email || '[Email]'}
  **LinkedIn Profile**: ${currentForm.linkedin || '[LinkedIn URL]'}
  **AI Agent Idea**: ${currentForm.idea || '[Idea Description]'}
  ---
  Does everything look correct, or would you like to change anything? (e.g., 'My email is wrong', 'Change the idea')"
- If the user wants to edit a field (e.g., "my email is wrong", "change the project idea"), update the corresponding field in your 'updates' object and then **return to the Reviewing State** by presenting the updated summary again.

**3. Submitting State:**
- **TRIGGER:** You enter this state ONLY IF you are in the 'Reviewing State' AND the user confirms the details are correct (e.g., "looks good", "yes", "submit it", "finish").
- **ACTION:**
  - Your 'message' should be a final confirmation like "Perfect! Submitting your AI Agent Idea now. Thank you!"
  - Your JSON response MUST include the flag **"isSubmissionReady": true**.

**Output Format:**
Always return a valid JSON object.
{
  "message": "...",
  "updates": { "fieldName": "newValue" },
  "isSubmissionReady": boolean // This MUST be true only in the Submitting State.
}
` + (currentFieldToAskFor ? `\n\n**Your next action is to ask the user: "${nextQuestion}" and extract the corresponding field: "${currentFieldToAskFor}".**` : ''),
          },
        ],
      };

    const contents: Content[] = [
      systemPrompt,
      ...conversation,
    ];

    const resp = await model.generateContent({ contents, generationConfig: { maxOutputTokens: 500 } });
    const text = resp.response.text().trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
      if (!parsed || typeof parsed.message !== 'string' || typeof parsed.updates !== 'object') {
          throw new Error('Invalid or incomplete JSON structure from Gemini.');
      }
    } catch (parseError) {
      console.error('Invalid JSON from Gemini:', text, parseError);
      return {
        message: "Sorry, I'm having trouble understanding. Could you please rephrase that?",
        updates: {},
      };
    }

    // Validate email if updated
    if (parsed.updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.updates.email)) {
      return { message: "That doesn't look like a valid email. Please try again.", updates: {} };
    }

    // Validate LinkedIn if updated
    if (parsed.updates.linkedin && !/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(parsed.updates.linkedin)) {
      return { message: "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourprofile).", updates: {} };
    }

    return parsed;
  } catch (err: any) {
    console.error('Gemini API error:', err);
    return {
      message: "Oops, something went wrong with the AI assistant. Please try again in a moment.",
      updates: {},
    };
  }
}