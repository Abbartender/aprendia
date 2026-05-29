import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, subject, title, enunciado, childName, childAge, childGrade, childTheme, childThemeEmoji } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 503 });
    }

    const gradeText = childGrade ? `${childGrade}° grado de primaria` : "primaria";
    const themeText = childTheme ? `Le encanta el tema: ${childTheme} ${childThemeEmoji || ""}.` : "";

    const prompt = `Create a personalized coloring page activity for ${childName || "a child"}, ${childAge || 8} years old, in ${gradeText}.
${themeText}

The activity is based on a school worksheet about "${title}" (subject: ${subject}).
Task description: ${enunciado || title}

Requirements for the coloring page:
- Black and white only, thick simple outlines easy to color with crayons
- Difficulty level appropriate for ${gradeText}
- Same type of activity and visual structure as the original worksheet
- If the child has a favorite theme (${childTheme || "general"}), subtly incorporate it in the decorative elements
- Child-friendly, fun, engaging illustrations
- Clear empty spaces to color
- Simple title at the top mentioning the activity
- Look like a printable school activity sheet
- NO text answers — only visual content to color and complete

Output a clean black and white coloring page, ready to print.`;

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
