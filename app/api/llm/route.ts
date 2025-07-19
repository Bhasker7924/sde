// app/api/gemini/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt, images = [] } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-pro-latest',
    });

    const generationInput: any[] = [{
      text: prompt,
    },];

    if (images.length > 0) {
      generationInput.push(...images.map((image: string) => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image,
        },
      })));
    }

    const result = await model.generateContent(generationInput);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ output: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
