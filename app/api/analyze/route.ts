import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un asistente educativo para niños de escuela primaria en Argentina.
Analizás fotos de tareas escolares y generás contenido pedagógico adaptado.
SIEMPRE respondés SOLO con JSON válido, sin texto adicional, sin backticks.`;

const USER_PROMPT = `Analizá esta imagen de tarea escolar y respondé SOLO con este JSON exacto:
{
  "subject": "materia detectada (Matemática / Lengua / Ciencias / Inglés / Música / Otra)",
  "title": "título o tema de la tarea",
  "taskType": "tipo (problemas_matematicos / dictado / investigacion / comprension_lectora / ejercicios_lingua / actividad_visual / otro)",
  "imageType": "tipo de hoja (fotocopia_oficial / cuaderno_companero / hoja_suelta / cuaderno_propio)",
  "enunciado": "texto limpio del enunciado/consigna SOLO lo que el niño debe hacer, sin las respuestas del compañero",
  "script": "explicación pedagógica simple del tema en 3-4 oraciones, para leer en voz alta al niño. Tono cálido y simple.",
  "summary": "resumen muy simple de 2-3 oraciones sobre el tema aprendido, para que el niño escuche camino a la escuela.",
  "extraActivity": "una actividad extra corta y divertida relacionada con el tema, adaptada para un niño de primaria"
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze error:", err);
    return NextResponse.json({ error: "Error al analizar la imagen" }, { status: 500 });
  }
}
