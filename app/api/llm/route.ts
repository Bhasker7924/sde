// app/api/llm/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: messages?.[messages.length - 1]?.content }],
        },
      ],
    });

    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      role: 'assistant',
      content: text,
    });
  } catch (err: any) {
    console.error('❌ Gemini API error:', err);
    return NextResponse.json(
      { error: 'Failed to generate response from Gemini' },
      { status: 500 }
    );
  }
}
