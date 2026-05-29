import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 503 });
    }

    // Llamada directa a la API de Gemini con generación de imagen
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                }
              },
              {
                text: "Remove all handwritten pencil marks, lines, and student writing from this worksheet image. Keep only the original printed content exactly as it was. Return a clean version of the printed worksheet without any handwriting."
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          }
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "Error de Gemini" }, { status: 502 });
    }

    const data = await res.json();

    // Extraer la imagen generada de la respuesta
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);

    if (imagePart?.inlineData) {
      return NextResponse.json({
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || "image/png",
      });
    }

    return NextResponse.json({ error: "No se generó imagen" }, { status: 500 });

  } catch (err) {
    console.error("clean error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
