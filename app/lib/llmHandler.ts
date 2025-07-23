// app/lib/llmHandler.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai'; // Make sure Content is imported

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('❌ GOOGLE_API_KEY is required in .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = 'gemini-2.5-flash-lite';

const FORM_FIELDS = ['name', 'email', 'linkedin', 'idea'] as const;

type FormState = {
  name?: string;
  email?: string;
  linkedin?: string;
  idea?: string;
};

export async function getLLMResponse(
  conversation: Content[],
  currentForm: FormState
) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    let nextQuestion = '';
    let currentFieldToAskFor: keyof FormState | undefined;

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

    // Define system prompt as a Content object
    // Ensure the text content is correctly formed within the 'parts' array
    const systemInstructionContent: Content = {
        role: 'user', // System instructions for Gemini 1.5 flash are best given by the 'user' role
        parts: [
          {
            text: `You are an AI Agent Idea Submission Assistant. Your goal is to help the user submit their AI agent idea by collecting required information.
The required fields for the AI agent idea submission are: Your Name (name), Contact Email (email), Your LinkedIn Profile (linkedin), and AI Agent Idea Description (idea).

**Current Submission Details (important for your state management):**
${JSON.stringify(currentForm, null, 2)}

**Your Task & State Machine:**

**1. Collecting State:**
- **TRIGGER:** You are in this state if any of the four required fields (name, email, linkedin, idea) are empty in 'Current Submission Details'.
- **ACTION:**
    - Your primary goal is to ask for the *next single missing field* in the following strict order:
        1.  **Your Name (name)**
        2.  **Contact Email (email)**
        3.  **Your LinkedIn Profile (linkedin)**
        4.  **AI Agent Idea Description (idea)**
    - Validate the user's input for 'email' (must look like an email) and 'linkedin' (must be a valid LinkedIn profile URL). If invalid, politely ask again for the *same* field and do not update \`updates\`.
    - Once you successfully extract valid information for the current missing field, provide a brief, positive confirmation, and then immediately ask for the next missing field in the sequence.

**2. Reviewing State:**
- **TRIGGER:** You enter this state ONLY when ALL four fields (name, email, linkedin, idea) are filled in 'Current Submission Details'.
- **ACTION:**
    - Your 'message' MUST clearly present a summary of *all* the collected data for the user to review. Structure it nicely, e.g.:
      "Great, I have all your details! Please take a moment to review them:
      ---
      **Your Name**: ${currentForm.name || '[Missing Name]'}
      **Contact Email**: ${currentForm.email || '[Missing Email]'}
      **LinkedIn Profile**: ${currentForm.linkedin || '[Missing LinkedIn URL]'}
      **AI Agent Idea**: ${currentForm.idea || '[Missing Idea Description]'}
      ---
      Does everything look correct, or would you like to change anything? (e.g., 'My email is wrong', 'Change the idea description')"
    - If the user indicates a desire to edit a specific field (e.g., "my email is wrong", "change the idea"), update ONLY the corresponding field in your \`updates\` object and then immediately **return to the Reviewing State** by presenting the updated summary again. Do not ask for other fields if one is being edited.

**3. Submitting State:**
- **TRIGGER:** You enter this state ONLY IF you are in the 'Reviewing State' AND the user explicitly confirms the details are correct (e.g., "looks good", "yes, submit", "finish", "all correct").
- **ACTION:**
    - Your 'message' should be a final, positive confirmation like: "Perfect! Submitting your AI Agent Idea now. Thank you!"
    - Your JSON response MUST include the flag **"isSubmissionReady": true**. This tells the frontend to complete the submission.

**Output Format:**
Always return a valid JSON object.
{
  "message": "A conversational response to the user.",
  "updates": { "fieldName": "extractedValue" }, // Object with fields to update, can be empty {}
  "isSubmissionReady": boolean // This MUST be true ONLY in the Submitting State.
}
` + (currentFieldToAskFor ? `\n\n**REMINDER TO AI:** Your next immediate response, if in the Collecting state, MUST be: "${nextQuestion}" and you MUST extract the corresponding field: "${currentFieldToAskFor}".` : ''),
          },
        ],
      };

    // Construct the full conversation for the model
    const contents: Content[] = [
      systemInstructionContent, // The first item in the conversation is the system instruction
      ...conversation,          // Followed by the actual user/assistant chat history
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
        message: "Sorry, I'm having trouble understanding your request right now. Could you please rephrase that?",
        updates: {},
      };
    }

    if (parsed.updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.updates.email)) {
      return { message: "That doesn't look like a valid email. Please try again.", updates: {} };
    }

    if (parsed.updates.linkedin && !/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(parsed.updates.linkedin)) {
      return { message: "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourprofile).", updates: {} };
    }

    return parsed;
  } catch (err: any) {
    console.error('Gemini API error in llmHandler:', err);
    return {
      message: "Oops, something went wrong with the AI assistant service. Please try again in a moment.",
      updates: {},
    };
  }
}