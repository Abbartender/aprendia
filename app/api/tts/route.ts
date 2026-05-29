import { NextRequest, NextResponse } from "next/server";

const ELEVEN_VOICES: Record<string, string> = {
  female: "XB0fDUnXU5powFXDhCwa", // Charlotte — multilingual, neutro
  male:   "iP95p4xoKVk53GoZ742B", // Chris — multilingual, neutro
};

const ELEVEN_MODEL = "eleven_multilingual_v2";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceKey } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs no configurado" }, { status: 503 });
    }
    if (!text) {
      return NextResponse.json({ error: "Falta texto" }, { status: 400 });
    }

    const voiceId = ELEVEN_VOICES[voiceKey] ?? ELEVEN_VOICES.female;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVEN_MODEL,
          language_code: "es",
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!res.ok) {
      const msg = await res.text();
      console.error("ElevenLabs error:", res.status, msg);
      return NextResponse.json({ error: "Error de ElevenLabs" }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("tts error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
