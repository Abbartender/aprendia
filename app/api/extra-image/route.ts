import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, subject, title, enunciado } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 503 });
    }

    const prompt = `Create a fun coloring page activity for a primary school child based on this school worksheet about "${title}" (subject: ${subject}).

The coloring page should:
- Have simple, thick outlines in black and white — easy to color with crayons
- Be visually similar in style and layout to the original worksheet (same type of activity, same visual elements)
- Include the same type of content: ${enunciado || title}
- Have clear empty spaces for the child to color
- Look like a hand-drawn illustration, not a photo
- Be child-friendly, fun, and engaging
- Include a simple title at the top
- NO handwriting to remove — this is a NEW clean coloring sheet

Output a black and white coloring page image, ready to print and color.`;

    const parts: object[] = [];

    // Si tenemos imagen original, la incluimos para que copie el estilo
    if (imageBase64 && mimeType) {
      parts.push({
        inline_data: { mime_type: mimeType, data: imageBase64 }
      });
    }
    parts.push({ text: prompt });

    const errors: string[] = [];

    for (const model of MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            },
          }),
        }
      );

      const body = await res.text();

      if (!res.ok) {
        const msg = `${model} → ${res.status}: ${body.slice(0, 200)}`;
        console.error("[extra-image]", msg);
        errors.push(msg);
        continue;
      }

      let data;
      try { data = JSON.parse(body); } catch { continue; }

      const responseParts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = responseParts.find(
        (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
      );

      if (imagePart?.inlineData) {
        console.log(`[extra-image] ✅ success with ${model}`);
        return NextResponse.json({
          imageBase64: imagePart.inlineData.data,
          mimeType: imagePart.inlineData.mimeType || "image/png",
        });
      }
    }

    return NextResponse.json({ error: "No se generó imagen", details: errors }, { status: 500 });

  } catch (err) {
    console.error("[extra-image] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
