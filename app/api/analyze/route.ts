import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── PASO 1: solo extrae texto crudo de la imagen
const EXTRACT_PROMPT = `Analizá esta imagen de tarea escolar y respondé SOLO con este JSON exacto, sin backticks:
{
  "subject": "materia detectada (Matemática / Lengua / Ciencias / Inglés / Música / Otra)",
  "title": "título o tema de la tarea",
  "imageType": "tipo de hoja (fotocopia_oficial / cuaderno_companero / hoja_suelta / cuaderno_propio)",
  "enunciado": "texto EXACTO del enunciado/consigna tal como aparece en la imagen, sin interpretar ni corregir, SOLO lo que el niño debe hacer"
}`;

// ── PASO 2: genera script pedagógico desde el texto ya corregido por la mamá
const SCRIPT_PROMPT = (enunciado: string, childAge: number) =>
  `Sos un asistente educativo para niños de primaria en Argentina.
La mamá o papá ya revisó y corrigió este enunciado de tarea:

"${enunciado}"

El niño tiene ${childAge} años. Respondé SOLO con este JSON exacto, sin backticks:
{
  "script": "explicación pedagógica simple del tema en 3-4 oraciones, para leer en voz alta al niño. Tono cálido y simple, como si hablaras con el niño.",
  "summary": "resumen muy simple de 2-3 oraciones sobre el tema, para que el niño escuche camino a la escuela.",
  "extraActivity": "una actividad extra corta y divertida relacionada con el tema"
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, step, enunciado, childAge } = await req.json();

    // ── PASO 2: generar script desde texto corregido
    if (step === "script") {
      if (!enunciado) return NextResponse.json({ error: "Falta enunciado" }, { status: 400 });

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: SCRIPT_PROMPT(enunciado, childAge || 8) }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      return NextResponse.json(result);
    }

    // ── PASO 1: extraer texto de la imagen
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: EXTRACT_PROMPT },
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
