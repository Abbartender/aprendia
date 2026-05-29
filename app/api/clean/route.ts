import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

async function tryGeminiClean(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  model: string,
  errors: string[]
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                text: "This is a school worksheet photo with a child's handwritten marks on top of the original printed content. Please remove ONLY the child's handwriting, pencil lines, crayon marks, and marker strokes. Keep the original printed worksheet exactly as it was — preserve all original colors, images, text, illustrations, and layout. The output should look like a brand new unused worksheet with full color, as if the child never touched it. Do NOT convert to black and white. Do NOT change contrast. Just remove the child's additions.",
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    }
  );

  const body = await res.text();

  if (!res.ok) {
    const msg = `${model} → ${res.status}: ${body.slice(0, 300)}`;
    console.error("[clean]", msg);
    errors.push(msg);
    return null;
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    const msg = `${model} → JSON parse error`;
    console.error("[clean]", msg);
    errors.push(msg);
    return null;
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  console.log(
    `[clean] ${model} parts:`,
    parts.map((p: Record<string, unknown>) => Object.keys(p))
  );

  const imagePart = parts.find(
    (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
  );
  if (imagePart?.inlineData) {
    return {
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  }

  const noImg = `${model} → no image in response`;
  errors.push(noImg);
  console.warn("[clean]", noImg);
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
        console.log(`[clean] ✅ success with model: ${model}`);
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({ error: "No se generó imagen", details: errors }, { status: 500 });
  } catch (err) {
    console.error("[clean] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
