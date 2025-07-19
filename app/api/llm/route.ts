import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  console.log("✅ Gemini /api/llm hit");

  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' }); // ✅ FIXED here

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: messages.at(-1)?.content || "Hello" }],
        },
      ],
    });

    return NextResponse.json({
      role: 'assistant',
      content: result.response.text(),
    });

  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
