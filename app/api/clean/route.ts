import { NextRequest, NextResponse } from "next/server";

// Intentamos dos modelos: el de preview de imagen y el experimental
const MODELS = [
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash-exp",
];

async function tryGeminiClean(apiKey: string, imageBase64: string, mimeType: string, model: string, errors?: string[]) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
              text: "Remove all handwritten pencil marks, lines, and student writing from this worksheet image. Keep only the original printed content exactly as it was. Return a clean version of the printed worksheet without any handwriting. Output must be an image."
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        }
      }),
    }
  );

  const body = await res.text();

  if (!res.ok) {
    const msg = `${model} → ${res.status}: ${body.slice(0, 300)}`;
    console.error(`[clean]`, msg);
    errors?.push(msg);
    return null;
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    console.error(`[clean] ${model} JSON parse error`);
    return null;
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  console.log(`[clean] ${model} parts:`, parts.map((p: Record<string, unknown>) => Object.keys(p)));

  const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);
  if (imagePart?.inlineData) {
    return {
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 503 });
    }

    const errors: string[] = [];
    for (const model of MODELS) {
      const result = await tryGeminiClean(apiKey, imageBase64, mimeType, model, errors);
      if (result) {
        console.log(`[clean] success with model: ${model}`);
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({ error: "No se generó imagen", details: errors }, { status: 500 });

  } catch (err) {
    console.error("[clean] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
