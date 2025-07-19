import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Log for debug (REMOVE later)
    console.log("✅ API HIT: /api/llm");
    console.log("Model used:", "gpt-3.5-turbo");

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ HARDCODED TO SAFE MODEL
      messages,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (err: any) {
    console.error("❌ OpenAI Error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error from OpenAI" },
      { status: 500 }
    );
  }
}
