// app/api/llm/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

if(!process.env.GOOGLE_API_KEY){
  throw new Error("X GOOGLE_API_KEY missing")
}

console.log(' API key Status',process.env.GOOGLW_API_KEY?'Key is present and has value' : 'Key is missing or empty')
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    // Convert OpenAI-style messages to Gemini-style contents
    const contents = messages.map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash-latest',
    });

    const result = await model.generateContent({ contents });
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Gemini Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
