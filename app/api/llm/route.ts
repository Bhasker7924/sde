// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// --- Type Definitions (THESE WERE LIKELY MISSING/COMMENTED OUT) ---
export type Message = {
  role: 'user' | 'assistant';
  content: string; // Your internal display field
  parts: { text: string }[]; // Required for LLM history/content
};

// This type should match your FormContext's FormData type for the fields that can be updated
type LLMManagedFormData = {
  name?: string;
  email?: string;
  linkedin?: string; // Using 'linkedin' to match your FormContext and AgentForm
  idea?: string;
};

type LLMResponseOutput = {
  message: string;
  updates: Partial<LLMManagedFormData>;
};
// --- END Type Definitions ---


// --- API Key Initialization ---
// IMPORTANT: Ensure GEMINI_API_KEY is set in your .env.local for local development
// and in Vercel Environment Variables for deployment.
console.log('API Key Status:', process.env.GEMINI_API_KEY ? 'Set (******)' : 'NOT SET');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" }); // Or "gemini-2.5-flash-lite-001" if you used the stable one

export async function POST(req: Request) {
  try {
    const { messages, currentFormData }: { messages: Message[], currentFormData: LLMManagedFormData } = await req.json();

    // 1. Determine what information is missing/needed
    let nextFieldToAskFor: keyof LLMManagedFormData | 'all_collected' = 'all_collected';
    if (!currentFormData.name || currentFormData.name.trim() === '') {
      nextFieldToAskFor = 'name';
    } else if (!currentFormData.email || currentFormData.email.trim() === '') {
      nextFieldToAskFor = 'email';
    } else if (!currentFormData.linkedin || currentFormData.linkedin.trim() === '') {
      nextFieldToAskFor = 'linkedin';
    } else if (!currentFormData.idea || currentFormData.idea.trim() === '') {
      nextFieldToAskFor = 'idea';
    }

    // 2. Dynamically construct the System Prompt based on missing fields
    let systemInstructionContent = `You are an AI assistant helping a user fill out a form for an AI agent idea.
    Your goal is to gather specific information: name, email, LinkedIn profile URL, and their AI agent idea.
    You must act as a structured information collection agent.

    Current form data already collected: ${JSON.stringify(currentFormData)}

    Instructions for your response:
    - ALWAYS respond with a friendly, natural language message.
    - ALWAYS include an 'updates' JSON object at the end of your response, even if it's empty ({}) or only contains a subset of fields.
    - **Crucially, if the user mentions any correction or update to a previously collected field (name, email, linkedin, idea), identify and include that updated field in the 'updates' JSON object.**
    - Only include fields in 'updates' that you have positively identified and extracted from the user's *current* message.
    - Do not include fields in 'updates' that are already correctly in 'Current form data already collected' unless the user is explicitly updating it.
    - For LinkedIn, accept variations like "linkedin.com/in/..." or just the username.
    - For AI Idea, accept a description.

    Example response format:
    {
      "message": "That's a great idea! What's your full name?",
      "updates": {
        "idea": "AI for recipe ingredients"
      }
    }
    `;

    let assistantFallbackMessage = '';
    if (nextFieldToAskFor === 'name') {
      systemInstructionContent += `\nYour primary focus now is to get the user's full name. If it's missing or unclear, ask for it.`;
      assistantFallbackMessage = "Hello! What's your full name?";
    } else if (nextFieldToAskFor === 'email') {
      systemInstructionContent += `\nYour primary focus now is to get the user's email address. If it's missing or unclear, ask for it.`;
      assistantFallbackMessage = "Great! What's your email address?";
    } else if (nextFieldToAskFor === 'linkedin') {
      systemInstructionContent += `\nYour primary focus now is to get the user's LinkedIn profile URL. If it's missing or unclear, ask for it.`;
      assistantFallbackMessage = "Thanks! Can you please provide your LinkedIn profile URL?";
    } else if (nextFieldToAskFor === 'idea') {
      systemInstructionContent += `\nYour primary focus now is to get the user's AI agent idea. If it's missing or unclear, ask for it.`;
      assistantFallbackMessage = "Got it! Now, please describe your AI agent idea.";
    } else if (nextFieldToAskFor === 'all_collected') {
      systemInstructionContent += `\nAll required information has been gathered. Summarize the collected information and ask for final confirmation from the user. Do not ask for new information.
      When summarizing, list each collected field clearly with emojis for better readability. For example: "Here's what I have so far: 👤 Name: [name], 📧 Email: [email], 🔗 LinkedIn: [linkedin], 💡 AI Idea: [idea]. Does this look correct? You can tell me if anything needs to be updated."`; // Enhanced for explicit formatting
      assistantFallbackMessage = `All details are collected! Here's what I have: Name: ${currentFormData.name}, Email: ${currentFormData.email}, LinkedIn: ${currentFormData.linkedin || 'N/A'}, Idea: ${currentFormData.idea}. Does this look correct?`;
    }

    // Filter out initial assistant messages if they appear first in the history
    // The Gemini API requires the first message in 'history' to be from 'user'.
    const filteredHistory = messages.filter((msg, index) => {
        if (index === 0 && msg.role === 'assistant') {
            return false;
        }
        return true;
    });

    console.log('Attempting to start chat with history:', JSON.stringify(filteredHistory.map(msg => ({ role: msg.role, parts: msg.parts }))));
    console.log('System Instruction being used:', systemInstructionContent);

    let chat;
    try {
        chat = model.startChat({
            history: filteredHistory.map(msg => ({
              role: msg.role,
              parts: msg.parts
            })),
            systemInstruction: { role: 'system', parts: [{ text: systemInstructionContent }] }
        });
        console.log('Chat object successfully created.');
    } catch (chatError) {
        console.error('ERROR during model.startChat():', chatError);
        throw new Error(`Failed to initialize chat session: ${chatError instanceof Error ? chatError.message : String(chatError)}`);
    }

    if (!chat || typeof chat.sendMessage !== 'function') {
        console.error('CRITICAL: Chat object is invalid or sendMessage method is missing.');
        throw new Error('Chat session could not be properly initialized. sendMessage method is missing.');
    }

    const lastUserMessageContent = messages[messages.length - 1]?.content || '';
    console.log('Last user message content:', lastUserMessageContent);

    // Send the last user message to the chat session
    const result = await chat.sendMessage(lastUserMessageContent);

    const response = await result.response;
    const fullText = response.text();

    // --- Parsing the LLM's output for message and updates JSON ---
    let llmMessage = fullText;
    let updatesFromLLM: Partial<LLMManagedFormData> = {};

    // Attempt to extract JSON from the end of the response
    const jsonMatch = fullText.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
        try {
            updatesFromLLM = JSON.parse(jsonMatch[0]) as Partial<LLMManagedFormData>;
            llmMessage = fullText.substring(0, fullText.length - jsonMatch[0].length).trim();
        } catch (e) {
            console.warn("Could not parse JSON from LLM response:", e);
            // Fallback: If JSON parsing fails, treat the whole response as a message.
        }
    }

    // If LLM didn't provide a message, use our fallback
    if (!llmMessage.trim() && assistantFallbackMessage) {
        llmMessage = assistantFallbackMessage;
    } else if (!llmMessage.trim()) {
        llmMessage = "I'm not sure how to respond. Can you rephrase?";
    }

    // Ensure the response always contains both message and updates
    return NextResponse.json<LLMResponseOutput>({
      message: llmMessage,
      updates: updatesFromLLM,
    });

  } catch (error: any) {
    console.error('🔥 Gemini API or Server Error:', error);
    // Add more detailed error info if it's an internal GenerativeAI error
    if (error.status && error.errorDetails) {
        console.error('Error Details:', JSON.stringify(error.errorDetails));
    }
    return NextResponse.json(
      { error: `Gemini API or Server Error: ${error.message || 'Unknown error'}` },
      { status: error.response?.status || 500 }
    );
  }
  }
