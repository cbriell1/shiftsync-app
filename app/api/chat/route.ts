// filepath: app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { PICKLES_AND_PLAY_KNOWLEDGE } from '@/lib/ai-knowledge';
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ role: 'assistant', content: "ERROR: Key missing." });

    const client = new GoogleGenerativeAI(apiKey);
    
    // 🏆 gemini-2.5-flash with Live Search grounding
    const model = client.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: PICKLES_AND_PLAY_KNOWLEDGE,
      tools: [
        {
          googleSearch: {},
        } as any,
      ],
    });

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })).filter((m: any, i: number) => {
      // 🧪 Gemini SDK requires history to START with 'user'
      if (i === 0 && m.role === 'model') return false;
      return true;
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ role: 'assistant', content: text });
  } catch (error: any) {
    console.error("🚨 AI Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
