// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Type for messages, now aligned with Generative AI SDK's Content type structure
export type Message = {
  role: 'user' | 'assistant';
  content: string; // Your internal display field
  parts: { text: string }[]; // Required for LLM history/content
};

// This type should match your FormContext's FormData type for the fields that can be updated
type LLMManagedFormData = {
  name?: string;
  email?: string;
  linkedin?: string;
  idea?: string;
};
type LLMResponseOutput = {
  message: string;
  updates: Partial<LLMManagedFormData>;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });

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
      systemInstructionContent += `\nAll required information has been gathered. Summarize the collected information and ask for final confirmation from the user. Do not ask for new information.`;
      assistantFallbackMessage = `All details are collected! Here's what I have: Name: ${currentFormData.name}, Email: ${currentFormData.email}, LinkedIn: ${currentFormData.linkedin || 'N/A'}, Idea: ${currentFormData.idea}. Does this look correct?`;
    }

    // Initialize chat session with history and system instruction
    const chat = model.startChat({
        history: messages.map(msg => ({ // Map your Message type to SDK's Content type
          role: msg.role,
          parts: msg.parts
        })),
        systemInstruction: { parts: [{ text: systemInstructionContent }] }
    });

    const lastUserMessageContent = messages[messages.length - 1]?.content || '';

    // Send the last user message to the chat session
    const result = await chat.sendMessage(lastUserMessageContent); // <--- Use chat.sendMessage

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
    return NextResponse.json(
      { error: `Gemini API or Server Error: ${error.message || 'Unknown error'}` },
      { status: error.response?.status || 500 }
    );
  }
}
