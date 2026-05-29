import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text, childAge } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Falta texto" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Sos un asistente educativo para niños de primaria en Argentina.
Un papá o mamá escribió el siguiente texto o tema para trabajar con su hijo/a de ${childAge || 8} años:

"${text}"

Respondé SOLO con este JSON exacto, sin backticks:
{
  "subject": "materia más probable (Matemática / Lengua / Ciencias / Inglés / Música / Otra)",
  "title": "título corto del tema",
  "script": "explicación pedagógica simple en 3-4 oraciones, tono cálido, para leer en voz alta al niño",
  "summary": "resumen de 2-3 oraciones para escuchar camino a la escuela"
}`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch (err) {
    console.error("generate error:", err);
    return NextResponse.json({ error: "Error al generar" }, { status: 500 });
  }
}
