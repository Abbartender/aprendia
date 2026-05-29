import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { childName, childAge, themeLabel, taskTitle, taskSubject } =
      await req.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Generá UNA actividad extra corta y divertida para un niño de ${childAge || 8} años llamado ${childName} que le gustan: ${themeLabel}.
El tema de la tarea es: "${taskTitle || taskSubject}".
La actividad debe usar "${themeLabel}" como contexto creativo. Máximo 3 oraciones. Solo el texto de la actividad, sin título.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("extra error:", err);
    return NextResponse.json({ error: "Error al generar actividad" }, { status: 500 });
  }
}
