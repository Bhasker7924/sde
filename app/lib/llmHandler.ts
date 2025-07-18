// app/lib/llmHandler.ts
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
console.log('Loaded :',process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

if(!process.env.OPEN_API_KEY){
  throw new Error("❌ OPENAI_API_KEY is missing from environment variables");
}

export async function getLLMResponse(conversation: ChatCompletionMessageParam[]) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Change to 'gpt-3.5-turbo' if needed
      messages: [
        {
          role: 'system',
          content: `You are a smart and friendly AI Copilot helping users fill out a form with these 4 fields:
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
        ...conversation,
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    // Safely parse JSON string from LLM
    try {
      return JSON.parse(content || '{}');
    } catch (err) {
      console.error('❌ Failed to parse response as JSON:', content);
      return {
        message: "Hmm, I had trouble understanding that. Could you say it again?",
        updates: {},
      };
    }
  } catch (err: any) {
    console.error('🔥 OpenAI error:', err.message || err);
    
    return {
      message: "Sorry, I'm having trouble connecting. Try again in a moment!",
      updates: {},
    };
  }
}
