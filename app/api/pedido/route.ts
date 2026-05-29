import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const IMAGE_KEYWORDS = ["lámina", "lamina", "imagen", "dibujo", "colorear", "ilustración", "ilustracion", "mapa", "poster", "póster", "cartel", "infografía", "infografia"];

const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

export async function POST(req: NextRequest) {
  try {
    const { pedido, childName, childAge, childGrade, childTheme, childCountry } = await req.json();

    const context = `El pedido es para ${childName || "un niño"}, ${childAge || 8} años, ${childGrade ? `${childGrade}° grado` : "primaria"}, de ${childCountry || "Argentina"}.${childTheme ? ` Le encanta: ${childTheme}.` : ""}`;

    // Detectar si el pedido pide una imagen
    const wantsImage = IMAGE_KEYWORDS.some(k => pedido.toLowerCase().includes(k));

    if (wantsImage) {
      // Intentar con Gemini imagen
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const prompt = `${context}

Pedido: ${pedido}

Create a high-quality, colorful educational image for a primary school child.
- Age-appropriate for ${childGrade ? `${childGrade}° grade` : "primary school"}
- Visually engaging, clear labels in Spanish
- Educational content accurate for ${childCountry || "Argentina"} curriculum
- Child-friendly style, bright colors
- Include a title in Spanish at the top`;

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
              imageBase64: imagePart.inlineData.data,
              mimeType: imagePart.inlineData.mimeType || "image/png",
            });
          }
        }
      }
      // Si Gemini falla, continúa con HTML via Claude
    }

    // Generar HTML o texto con Claude
    const systemPrompt = `Sos un asistente educativo para niños de primaria en ${childCountry || "Argentina"}. Generás materiales educativos de alta calidad, sin errores, adaptados al currículo local.`;

    const userPrompt = `${context}

Pedido del padre/madre: "${pedido}"

Generá el material solicitado en formato HTML completo (desde <html> hasta </html>).
Requisitos:
- Contenido educativamente correcto para ${childGrade ? `${childGrade}° grado` : "primaria"} de ${childCountry || "Argentina"}
- Sin errores gramaticales ni conceptuales
- Diseño limpio, listo para imprimir (fondo blanco, fuente clara)
- Título descriptivo, contenido bien organizado
- Si corresponde, incluí instrucciones claras para el niño
${childTheme ? `- Podés incorporar referencias a ${childTheme} en los ejemplos` : ""}

Respondé SOLO con el HTML, sin backticks ni explicaciones.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const html = raw.replace(/```html|```/g, "").trim();

    if (html.startsWith("<")) {
      return NextResponse.json({ html });
    }
    return NextResponse.json({ text: raw });

  } catch (err) {
    console.error("[pedido] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
