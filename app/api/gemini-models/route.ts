import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 503 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  );
  const data = await res.json();

  // Filtrar solo los que soporten generateContent y/o imagen
  const models = (data.models || []).map((m: { name: string; supportedGenerationMethods?: string[]; description?: string }) => ({
    name: m.name,
    methods: m.supportedGenerationMethods,
    description: m.description,
  }));

  return NextResponse.json({ models, total: models.length });
}
