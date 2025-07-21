// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// ... (Your Message and LLMManagedFormData types as they are) ...

// --- API Key Initialization ---
console.log('API Key Status:', process.env.GEMINI_API_KEY ? 'Set (******)' : 'NOT SET');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
// Keep using "gemini-2.5-flash-lite-preview-06-17" if that's what was working for you.
// Or "gemini-2.5-flash-lite-001" if you prefer the stable version.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" }); 

export async function POST(req: Request) {
  try {
    const { messages, currentFormData }: { messages: Message[], currentFormData: LLMManagedFormData } = await req.json();

    // ... (Your nextFieldToAskFor and systemInstructionContent logic remains the same) ...
    let nextFieldToAskFor: keyof LLMManagedFormData | 'all_collected' = 'all_collected';
    // ... (rest of determine missing info and system prompt construction) ...

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

    // ... (rest of your response parsing and return logic) ...

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
