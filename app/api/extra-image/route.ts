import { NextRequest, NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, subject, title, enunciado, extraTextBrief, childName, childAge, childGrade, childTheme, childThemeEmoji } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 503 });
    }

    const gradeText = childGrade ? `${childGrade}° grado de primaria` : "primaria";
    const themeText = childTheme ? `Le encanta el tema: ${childTheme} ${childThemeEmoji || ""}.` : "";

    const prompt = `Generate a COLORING PAGE (página para colorear) for a ${childAge || 8} year old child in ${gradeText}. ${themeText}

Activity to illustrate (reviewed by parent): "${extraTextBrief || enunciado || title}"
Context: ${subject} — "${title}"

STRICT RULES — the output image MUST be:
✅ PURE BLACK AND WHITE — only black outlines on white background
✅ ZERO color fills — no gray, no shading, no colored areas whatsoever
✅ Thick, clear outlines (2-3px minimum) suitable for coloring with crayons
✅ Large empty white areas inside the outlines for the child to color
✅ Simple, cartoon-style line art like a printed coloring book page
✅ A short title in Spanish at the top in outlined/hollow letters
✅ Appropriate complexity for ${gradeText}
${childTheme ? `✅ Include decorative elements related to ${childTheme} in the border or background outlines` : ""}

❌ NO color fills of any kind
❌ NO photographs or realistic images
❌ NO gray shading or gradients
❌ NO colored backgrounds

Think: a page torn from a children's coloring book — only black lines on white paper.`;

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
