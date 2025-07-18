import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Request Body:", body);

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid messages format");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
    });

    const reply = chatResponse.choices[0]?.message?.content;
    console.log("✅ LLM Reply:", reply);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("❌ LLM API Error:", error);
    return NextResponse.json({ error: "LLM API failed" }, { status: 500 });
  }
}
