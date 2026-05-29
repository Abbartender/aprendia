import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const IMAGE_KEYWORDS = ["lámina", "lamina", "imagen", "dibujo", "colorear", "ilustración", "ilustracion", "mapa", "poster", "póster", "cartel", "infografía", "infografia"];

const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const { messages, childName, childAge, childGrade, childTheme, childCountry } = await req.json() as {
      messages: ChatMessage[];
      childName?: string;
      childAge?: number;
      childGrade?: number;
      childTheme?: string;
      childCountry?: string;
    };

    if (!messages?.length) {
      return NextResponse.json({ error: "Sin mensajes" }, { status: 400 });
    }

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const context = `Perfil del niño: ${childName || "sin nombre"}, ${childAge || 8} años, ${childGrade ? `${childGrade}° grado` : "primaria"}, de ${childCountry || "Argentina"}.${childTheme ? ` Tema favorito: ${childTheme}.` : ""}`;

    const wantsImage = IMAGE_KEYWORDS.some(k => lastUserMsg.toLowerCase().includes(k));
    const isRefinement = messages.length > 2; // hay historial previo

    // Si pide imagen y no es refinamiento de texto → intentar Gemini
    if (wantsImage && !isRefinement) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        // Construir contexto de conversación para Gemini
        const conversationContext = messages.slice(0, -1).map(m => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`).join("\n");
        const prompt = `${context}
${conversationContext ? `\nContexto previo:\n${conversationContext}\n` : ""}
Pedido actual: ${lastUserMsg}

Create a high-quality, colorful educational image for a primary school child.
- Age-appropriate for ${childGrade ? `${childGrade}° grade` : "primary school"} in ${childCountry || "Argentina"}
- Visually engaging, clear labels in Spanish
- Educational content accurate for ${childCountry || "Argentina"} curriculum
- Child-friendly style, bright colors
- Include a descriptive title in Spanish`;

        for (const model of GEMINI_IMAGE_MODELS) {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
              }),
            }
          );
          if (!res.ok) continue;
          const data = await res.json().catch(() => null);
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);
          if (imagePart?.inlineData) {
            return NextResponse.json({
              reply: "Acá está la imagen que generé. ¿Querés que cambie algo, agregue más detalle o la adapte de alguna forma?",
              result: {
                imageBase64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType || "image/png",
              },
            });
          }
        }
      }
    }

    // Claude: texto/HTML con historial completo
    const systemPrompt = `Sos un asistente educativo para niños de primaria de ${childCountry || "Argentina"}.
${context}
Generás materiales educativos de alta calidad, sin errores, adaptados al currículo local.

Cuando el usuario pide un material (ejercicios, actividades, láminas de texto, sopas de letras, etc.):
- Generá el contenido como HTML completo listo para imprimir (desde <html> hasta </html>)
- Contenido correcto para ${childGrade ? `${childGrade}° grado` : "primaria"} de ${childCountry || "Argentina"}
- Sin errores gramaticales ni conceptuales
- Diseño limpio, fondo blanco, fuente clara, listo para imprimir

Cuando el usuario pide correcciones o cambios: aplicalos y devolvé el HTML actualizado.
Cuando el usuario hace una pregunta simple: respondé en texto plano sin HTML.

SIEMPRE respondé con este JSON exacto sin backticks:
{
  "reply": "mensaje breve al usuario explicando qué hiciste o preguntando si necesita cambios",
  "result": {
    "html": "HTML completo si generaste un documento, null si no",
    "text": "texto plano si es solo una respuesta, null si generaste HTML"
  }
}`;

    // Convertir historial al formato de Claude
    const claudeMessages = messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant"
        ? m.content // el reply anterior
        : m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: { reply?: string; result?: { html?: string; text?: string } };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Si no parsea JSON, devolver como texto
      return NextResponse.json({
        reply: raw,
        result: null,
      });
    }

    return NextResponse.json({
      reply: parsed.reply || "Listo. ¿Querés que cambie algo?",
      result: parsed.result?.html
        ? { html: parsed.result.html }
        : parsed.result?.text
        ? { text: parsed.result.text }
        : null,
    });

  } catch (err) {
    console.error("[pedido] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
