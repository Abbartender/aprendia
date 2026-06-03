import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { childName, childAge, themeLabel, taskTitle, taskSubject, enunciado, childGrade, childCountry } =
      await req.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Generá UNA actividad extra corta para ${childName || "el niño"} de ${childAge || 8} años, ${childGrade ? `${childGrade}° grado` : "primaria"} de ${childCountry || "Argentina"}.

La tarea original es sobre: "${taskTitle || taskSubject}"
Contenido específico: ${enunciado || taskTitle || taskSubject}

REGLA PRINCIPAL: La actividad extra debe practicar el MISMO concepto educativo de la tarea original. No puede ser sobre otro tema.
${themeLabel ? `REGLA SECUNDARIA: Podés mencionar "${themeLabel}" en los ejemplos o números usados, pero la actividad tiene que seguir siendo sobre "${taskTitle || taskSubject}".` : ""}

Ejemplos de cómo hacerlo bien:
- Si la tarea es sobre "antes y después" de números → la actividad extra es otro ejercicio de antes/después, quizás con números más grandes o una secuencia con personajes de ${themeLabel || "animales"}.
- Si la tarea es sobre sumas → la actividad extra tiene más sumas, con contexto divertido.
- Si la tarea es sobre lectura → actividad de comprensión o completar palabras.

Escribí solo el texto de la actividad, máximo 3 oraciones, sin título. En español, claro y concreto.`,
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
