import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── PASO 1: solo extrae texto crudo de la imagen
const EXTRACT_PROMPT = `Analizá esta imagen de tarea escolar. Puede ser una fotocopia, hoja impresa o cuaderno con escritura a mano.
Respondé SOLO con este JSON exacto, sin backticks ni texto adicional:
{
  "subject": "materia detectada (Matemática / Lengua / Ciencias / Inglés / Música / Otra)",
  "title": "título principal o tema de la actividad",
  "imageType": "tipo de hoja (fotocopia_oficial / cuaderno_companero / hoja_suelta / cuaderno_propio)",
  "enunciado": "Transcribí TODO el contenido relevante visible en la imagen: preguntas, consignas, respuestas escritas, definiciones, listas, lo que sea que aparezca escrito. Si es un cuaderno con preguntas y respuestas, incluí tanto las preguntas como las respuestas del niño. Si es una fotocopia, incluí la consigna completa. Sé exhaustivo — mejor que sobre a que falte. NUNCA resumir ni interpretar, copiar el texto tal cual aparece."
}`;

// ── PASO 2: genera script pedagógico desde el texto ya corregido por la mamá
const SCRIPT_PROMPT = (enunciado: string, childAge: number, childGrade?: number, childName?: string, childTheme?: string, childCountry?: string) =>
  `Sos un asistente educativo para niños de primaria de ${childCountry || "Argentina"}.
La mamá o papá ya revisó y corrigió este enunciado de tarea:

"${enunciado}"

El niño se llama ${childName || "el niño"}, tiene ${childAge} años y cursa ${childGrade ? `${childGrade}° grado` : "primaria"} en ${childCountry || "Argentina"}.${childTheme ? ` Su tema favorito es: ${childTheme}.` : ""}

IMPORTANTE:
- Adaptá el vocabulario, ejemplos y nivel de complejidad exactamente a ${childGrade ? `${childGrade}° grado` : "primaria"} del currículo de ${childCountry || "Argentina"}
- Usá español neutro y claro, sin errores gramaticales
- Dirigite a ${childName || "el niño"} por su nombre en el script
- El script debe sonar natural al escucharse en voz alta, sin listas ni bullets${childTheme ? `\n- Podés usar analogías con ${childTheme} para hacer la explicación más cercana` : ""}

Respondé SOLO con este JSON exacto, sin backticks ni texto extra:
{
  "script": "explicación pedagógica del tema en 3-4 oraciones fluidas para leer en voz alta. Tono cálido, simple y directo. Sin listas.",
  "summary": "resumen de 2-3 oraciones para escuchar camino a la escuela.",
  "extraActivity": "una actividad corta, concreta y divertida apropiada para ${childGrade ? `${childGrade}° grado` : "su edad"} de ${childCountry || "Argentina"}"
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, step, enunciado, childAge, childGrade, childName, childTheme, childCountry } = await req.json();

    // ── PASO 2: generar script desde texto corregido
    if (step === "script") {
      if (!enunciado) return NextResponse.json({ error: "Falta enunciado" }, { status: 400 });

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: SCRIPT_PROMPT(enunciado, childAge || 8, childGrade, childName, childTheme, childCountry) }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      return NextResponse.json(result);
    }

    // ── PASO CLEAN: reproducir documento como HTML idéntico sin trazos
    if (step === "clean") {
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Analizá esta imagen de una hoja escolar. Tiene contenido impreso/oficial Y trazos o escritura hechos a mano por un niño (respuestas, líneas conectoras, marcas).

Tu tarea: reproducir el documento impreso original en HTML, idéntico visualmente al original, IGNORANDO completamente todo lo que escribió o dibujó el niño.

Reglas:
- Usá las mismas fuentes aproximadas (bold para títulos, etc.)
- Conservá el mismo tamaño relativo de texto
- Conservá la misma disposición/layout (columnas, listas, tablas si hay)
- Si hay imágenes o íconos (dados, figuras, etc.) reproducílos con emojis o unicode equivalente
- NO incluyas nada escrito a mano por el niño
- Respondé SOLO con HTML completo (desde <html> hasta </html>), sin backticks ni explicaciones`,
            },
          ],
        }],
      });
      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const html = raw.replace(/```html|```/g, "").trim();
      return NextResponse.json({ html });
    }

    // ── PASO 1: extraer texto de la imagen
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            { type: "text", text: EXTRACT_PROMPT },
          ],
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);

  } catch (err) {
    console.error("analyze error:", err);
    return NextResponse.json({ error: "Error al analizar la imagen" }, { status: 500 });
  }
}
