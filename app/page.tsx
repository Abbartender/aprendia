"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────

interface Profile {
  name: string;
  age: number;
  grade: number;
  country: string; // país donde estudia (para adaptar currículo)
  theme: string;
  themeLabel: string;
  themeEmoji: string;
  voice: "female" | "male";
}

interface TaskData {
  subject: string;
  title: string;
  taskType?: string;
  imageType?: string;
  enunciado?: string;
  text?: string;
  script: string;
  summary: string;
  extraActivity?: string;
  imageData?: string;
  // demo fields
  type?: string;
  typeCss?: string;
  tags?: { text: string; css: string }[];
}

type Screen = "lock" | "home" | "processing" | "review" | "pizarra" | "libre" | "pedido";
type AppMode = "copiar" | "reforzar" | "pedido" | null;

const APP_PIN = "1234"; // ← cambiá esta clave

// ─── Constants ───────────────────────────────────────────────

const THEME_EMOJIS: Record<string, string> = {
  dinos: "🦕", space: "🚀", football: "⚽", unicorn: "🦄",
  ocean: "🐬", music: "🎵", art: "🎨", nature: "🌿",
  cats: "🐱", dogs: "🐶", princess: "👸", superhero: "🦸",
  cooking: "🍕", gaming: "🎮", horses: "🐴", robots: "🤖",
};

const THEMES = [
  { key: "dinos", label: "Dinos", emoji: "🦕" },
  { key: "space", label: "Espacio", emoji: "🚀" },
  { key: "football", label: "Fútbol", emoji: "⚽" },
  { key: "unicorn", label: "Unicornio", emoji: "🦄" },
  { key: "ocean", label: "Mar", emoji: "🐬" },
  { key: "music", label: "Música", emoji: "🎵" },
  { key: "art", label: "Arte", emoji: "🎨" },
  { key: "nature", label: "Natura", emoji: "🌿" },
  { key: "cats", label: "Gatos", emoji: "🐱" },
  { key: "dogs", label: "Perros", emoji: "🐶" },
  { key: "princess", label: "Princesas", emoji: "👸" },
  { key: "superhero", label: "Súper héroes", emoji: "🦸" },
  { key: "cooking", label: "Cocina", emoji: "🍕" },
  { key: "gaming", label: "Videojuegos", emoji: "🎮" },
  { key: "horses", label: "Caballos", emoji: "🐴" },
  { key: "robots", label: "Robots", emoji: "🤖" },
];

const DEMO: Record<string, TaskData> = {
  math: {
    subject: "Matemática", title: "Comparamos números",
    type: "🔢 Matemática", typeCss: "background:#FFF8EE;color:#C47A00",
    text: "Un niño caminó 3.500 y otro 4.200 pasos. ¿Cuál caminó más?\n\nResuelve los siguientes problemas:\n\n① En una semana, Sofía hizo 2.350 minutos de actividad física y Tomás hizo 2.800 minutos. ¿Quién hizo más? ¿Cuántos minutos más?\n\n② Un grupo junto 5.600 puntos en un juego y 4.400 en otro. ¿En cuál junto más? ¿Cuánto junto en total?",
    script: "Hoy vamos a comparar números grandes. Cuando comparamos números, miramos primero cuántas cifras tienen. El número con más cifras es siempre el más grande. Si tienen las mismas cifras, comparamos de izquierda a derecha.",
    summary: "Hoy aprendimos a comparar números grandes. Miramos cuántas cifras tiene cada número: el que tiene más cifras es el mayor. Si tienen la misma cantidad de cifras, comparamos de izquierda a derecha, dígito por dígito.",
    tags: [{ text: "📋 Hoja de compañero", css: "background:#EEF0FF;color:#4B44CC" }, { text: "🔢 Cuentas y problemas", css: "background:#FFF8EE;color:#C47A00" }],
  },
  lang: {
    subject: "Lengua", title: "Sinónimos y Antónimos",
    type: "📖 Lengua", typeCss: "background:#EEF0FF;color:#4B44CC",
    text: "Cuando dos palabras tienen el mismo significado son sinónimas.\nCuando dos palabras tienen significados contrarios son antónimas.\n\n1. Relaciona cada palabra con su sinónimo:\nbajar → descender\nocultar → esconder\nprincipio → inicio\ncamino → senda\n\n2. Marca el antónimo de cada palabra:\nprincipio → final\nalegría → tristeza\nhermosa → fea",
    script: "Los sinónimos son palabras con el mismo significado, como 'feliz' y 'contento'. Los antónimos son palabras con significado opuesto, como 'frío' y 'caliente'. Podemos encontrar sinónimos y antónimos en el diccionario.",
    summary: "Hoy aprendimos que los sinónimos son palabras con el mismo significado, y los antónimos son palabras con significado contrario. Practicamos con ejemplos como bajar-descender (sinónimos) y alegría-tristeza (antónimos).",
    tags: [{ text: "📄 Fotocopia del profe", css: "background:#E8F8F0;color:#2E7D57" }, { text: "📖 Lengua", css: "background:#EEF0FF;color:#4B44CC" }],
  },
  sci: {
    subject: "Ciencias Sociales", title: "El agua en Argentina — 1810",
    type: "🔬 Ciencias", typeCss: "background:#E8F8F0;color:#2E7D57",
    text: "★ Tarea: Investigar cómo se obtenía el agua en Argentina en 1810, cómo llegaba a los hogares y cómo era utilizado ese recurso.",
    script: "En 1810 no había agua corriente en las casas. El agua se obtenía de ríos, pozos y aljibes. Los aguateros la llevaban en barriles por las calles. El agua era un recurso muy valioso que se cuidaba mucho porque era difícil conseguirla.",
    summary: "En 1810, en Argentina no había agua de canilla. El agua venía de ríos y pozos, y los aguateros la repartían en barriles. Era muy valiosa porque conseguirla era difícil. Hoy tenemos agua en nuestras casas gracias a las redes de distribución.",
    tags: [{ text: "✍️ Hoja manuscrita", css: "background:#FFF8EE;color:#C47A00" }, { text: "🔬 Ciencias", css: "background:#E8F8F0;color:#2E7D57" }],
  },
};

// ─── Main Component ──────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lock");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [pizarraText, setPizarraText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [extraMode, setExtraMode] = useState<"text" | "image">("text");
  const [extraImage, setExtraImage] = useState<string | null>(null);
  const [extraImageLoading, setExtraImageLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playBtnLabel, setPlayBtnLabel] = useState("▶");
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(0.8);
  const [exportLoading, setExportLoading] = useState(false);
  const [processingFor, setProcessingFor] = useState("el niño");

  // pizarra libre
  const [libreText, setLibreText] = useState("");
  const [libreLoading, setLibreLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanedHtml, setCleanedHtml] = useState<string | null>(null);
  const [cleanedImage, setCleanedImage] = useState<string | null>(null);

  const [showUpgrade, setShowUpgrade] = useState(false); // unused, kept to avoid refactor

  // ── Tipografía pizarra ─────────────────────────────────
  const [useUppercase, setUseUppercase] = useState(false);

  // ── Modo de la app ─────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>(null);

  // ── Pedidos (chat) ─────────────────────────────────────
  type PedidoMessage = {
    role: "user" | "assistant";
    text: string;
    result?: { html?: string; imageBase64?: string; mimeType?: string; text?: string };
  };
  const [pedidoText, setPedidoText] = useState("");
  const [pedidoLoading, setPedidoLoading] = useState(false);
  const [pedidoMessages, setPedidoMessages] = useState<PedidoMessage[]>([]);
  const pedidoChatRef = useRef<HTMLDivElement>(null);

  // review screen
  const [reviewText, setReviewText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  // profile form
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGrade, setFormGrade] = useState("1");
  const [formCountry, setFormCountry] = useState("Argentina");
  const [formTheme, setFormTheme] = useState("dinos");
  const [formVoice, setFormVoice] = useState<"female" | "male">("female");
  const [customEmoji, setCustomEmoji] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  // word-by-word refs
  const wordSpansRef = useRef<HTMLSpanElement[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bbTextRef = useRef<HTMLDivElement>(null);

  // ── Load profiles from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("aprendia_profiles");
    if (stored) {
      const p = JSON.parse(stored) as Profile[];
      setProfiles(p);
      if (p.length > 0) setActiveProfile(p[0]);
    }
  }, []);

  // ── Pre-cargar formulario con perfil activo cuando se abre el modal
  useEffect(() => {
    if (modalOpen && activeProfile) {
      setFormName(activeProfile.name);
      setFormAge(String(activeProfile.age));
      setFormGrade(String(activeProfile.grade || 1));
      setFormCountry(activeProfile.country || "Argentina");
      setFormVoice(activeProfile.voice);
      if (activeProfile.theme === "__custom__") {
        setIsCustomTheme(true);
        setCustomTheme(activeProfile.themeLabel);
        setCustomEmoji(activeProfile.themeEmoji);
      } else {
        setIsCustomTheme(false);
        setFormTheme(activeProfile.theme);
      }
    } else if (modalOpen && !activeProfile) {
      setFormName(""); setFormAge(""); setFormGrade("1"); setFormCountry("Argentina");
    }
  }, [modalOpen, activeProfile]);

  // ── Toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // ── Save profile
  function saveProfile() {
    if (!formName.trim()) { showToast("⚠️ Escribí el nombre del niño"); return; }
    const themeLabel = isCustomTheme ? (customTheme.trim() || "otro") : formTheme;
    const themeEmoji = isCustomTheme ? (customEmoji.trim() || "⭐") : (THEME_EMOJIS[formTheme] || "⭐");
    const profile: Profile = {
      name: formName.trim(),
      age: parseInt(formAge) || 8,
      grade: parseInt(formGrade) || 1,
      country: formCountry || "Argentina",
      theme: isCustomTheme ? "__custom__" : formTheme,
      themeLabel,
      themeEmoji,
      voice: formVoice,
    };
    const updated = [...profiles];
    const idx = updated.findIndex((p) => p.name === profile.name);
    if (idx >= 0) updated[idx] = profile; else updated.push(profile);
    setProfiles(updated);
    localStorage.setItem("aprendia_profiles", JSON.stringify(updated));
    setActiveProfile(profile);
    setModalOpen(false);
    showToast(`✨ Perfil de ${profile.name} guardado`);
  }

  // ── File upload
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => startProcessing(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => startProcessing(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Processing
  async function startProcessing(imageData: string) {
    setProcessingFor(activeProfile?.name || "el niño");
    setScreen("processing");
    window.scrollTo(0, 0);

    animateSteps(async () => {
      await analyzeWithClaude(imageData);
    });
  }

  function animateSteps(onDone: () => void, fast = false) {
    const delay = fast ? 450 : 800;
    let step = 0;
    const steps = ["step1", "step2", "step3", "step4", "step5"];
    // reset
    steps.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = i === 0 ? "active" : "";
      const icon = el.querySelector(".step-icon") as HTMLElement;
      if (icon) {
        icon.className = "step-icon" + (i === 0 ? " active" : "");
        icon.textContent = ["🔍", "🧹", "📝", "🧠", "✨"][i];
      }
    });
    const iv = setInterval(() => {
      if (step > 0) {
        const prev = document.getElementById(steps[step - 1]);
        if (prev) {
          prev.className = "done";
          const icon = prev.querySelector(".step-icon") as HTMLElement;
          if (icon) { icon.className = "step-icon done"; icon.textContent = "✓"; }
        }
      }
      if (step < steps.length) {
        const cur = document.getElementById(steps[step]);
        if (cur) {
          cur.className = "active";
          const icon = cur.querySelector(".step-icon") as HTMLElement;
          if (icon) icon.className = "step-icon active";
        }
        step++;
      } else {
        clearInterval(iv);
        onDone();
      }
    }, delay);
  }

  async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        if (i < retries) await new Promise(r => setTimeout(r, 1200));
      } catch {
        if (i < retries) await new Promise(r => setTimeout(r, 1200));
        else throw new Error("network error");
      }
    }
    throw new Error("max retries");
  }

  async function analyzeWithClaude(imageData: string) {
    try {
      const base64 = imageData.split(",")[1];
      const mimeType = imageData.split(";")[0].split(":")[1];

      const res = await fetchWithRetry("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) throw new Error("analyze failed");
      const result: TaskData = await res.json();
      result.imageData = imageData;
      result.script = ""; // se genera después de la revisión
      result.summary = "";
      showReview(result);
    } catch (err) {
      console.error(err);
      showReview({ ...DEMO.math, imageData: imageData });
      showToast("⚠️ Usando modo demo — configurá las API keys en Vercel");
    }
  }

  // ── Demo cards
  function loadDemo(type: "math" | "lang" | "sci") {
    setProcessingFor(activeProfile?.name || "el niño");
    setScreen("processing");
    window.scrollTo(0, 0);
    animateSteps(() => showPizarra(DEMO[type]), true);
  }

  // ── Review
  function showReview(data: TaskData) {
    setTaskData(data);
    setReviewText(data.enunciado || data.text || "");
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setScreen("review");
    window.scrollTo(0, 0);
  }

  async function cleanTraces() {
    if (!taskData?.imageData) return;
    setCleanLoading(true);
    setCleanedImage(null);
    setCleanedHtml(null);
    try {
      const base64 = taskData.imageData.split(",")[1];
      const mimeType = taskData.imageData.split(";")[0].split(":")[1];

      // 1️⃣ Intentar con Gemini (borra lápiz, fibra, marcadores — IA semántica)
      const res = await fetch("/api/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageBase64) {
          setCleanedImage(`data:${data.mimeType || "image/png"};base64,${data.imageBase64}`);
          showToast("✅ Imagen limpia lista para descargar");
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      const detail = String(errData.details?.[0] || errData.error || "");
      if (detail.includes("429") || detail.includes("quota")) {
        showToast("⚠️ Cuota de Gemini agotada. Habilitá billing en Google AI Studio.");
      } else {
        showToast(`⚠️ ${detail.slice(0, 120) || "No se pudo limpiar la imagen"}`);
      }
    } catch {
      showToast("⚠️ No se pudo limpiar");
    } finally {
      setCleanLoading(false);
    }
  }

  async function confirmReview() {
    if (!taskData) return;
    setReviewLoading(true);
    // Primero actualiza el texto con la corrección de la mamá
    const base = { ...taskData, enunciado: reviewText, text: reviewText };
    // Luego genera script y summary desde el texto corregido
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "script",
          enunciado: reviewText,
          childAge: activeProfile?.age || 8,
          childGrade: activeProfile?.grade || 1,
          childName: activeProfile?.name || "el niño",
          childTheme: activeProfile?.themeLabel || "",
          childCountry: activeProfile?.country || "Argentina",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showPizarra({ ...base, script: data.script, summary: data.summary, extraActivity: data.extraActivity });
        return;
      }
    } catch { /* fallback */ }
    setReviewLoading(false);
    showPizarra(base);
  }

  async function generateFromText() {
    if (!libreText.trim()) { showToast("⚠️ Escribí el tema o texto primero"); return; }
    setLibreLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: libreText, childAge: activeProfile?.age || 8 }),
      });
      const data = await res.json();
      showPizarra({
        subject: data.subject || "General",
        title: data.title || "Pizarra libre",
        enunciado: libreText,
        text: libreText,
        script: data.script || "",
        summary: data.summary || "",
      });
    } catch {
      // Si falla la API, igual abre la pizarra con el texto escrito
      showPizarra({
        subject: "General",
        title: "Pizarra libre",
        enunciado: libreText,
        text: libreText,
        script: libreText,
        summary: "",
      });
    } finally {
      setLibreLoading(false);
    }
  }

  // ── Pizarra
  function showPizarra(data: TaskData) {
    stopAudio();
    setTaskData(data);
    setScriptText(data.script || "");
    setPizarraText(data.enunciado || data.text || "");
    setShowExtra(false);
    setExtraText("");
    setScreen("pizarra");
    window.scrollTo(0, 0);
  }

  // ── Word spans (rebuild when pizarraText changes, but only if not editing)
  const isEditingPizarra = useRef(false);

  useEffect(() => {
    if (screen !== "pizarra" || !bbTextRef.current) return;
    if (isEditingPizarra.current) return;
    const container = bbTextRef.current;
    container.innerHTML = "";
    wordSpansRef.current = [];

    const paragraphs = pizarraText.split("\n");
    paragraphs.forEach((para, pi) => {
      if (para.trim() === "") {
        container.appendChild(document.createElement("br"));
        return;
      }
      para.split(" ").forEach((word) => {
        if (!word) return;
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = word + " ";
        container.appendChild(span);
        wordSpansRef.current.push(span);
      });
      if (pi < paragraphs.length - 1) container.appendChild(document.createElement("br"));
    });
  }, [pizarraText, screen]);

  // ── Audio
  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (wordIntervalRef.current) { clearInterval(wordIntervalRef.current); wordIntervalRef.current = null; }
    setIsPlaying(false);
    setPlayBtnLabel("▶");
    setAudioProgress(0);
    wordSpansRef.current.forEach((s) => s.classList.remove("highlight", "spoken"));
  }

  async function startAudio() {
    stopAudio();
    const text = wordSpansRef.current.map((s) => s.textContent).join("").trim();
    if (!text) return;

    setPlayBtnLabel("⏳");

    const voiceKey = activeProfile?.voice || "female";
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceKey }),
    });

    if (!res.ok) {
      setPlayBtnLabel("▶");
      startWebSpeech(text);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    const totalWords = wordSpansRef.current.length;
    let wordIndex = 0;

    audio.addEventListener("timeupdate", () => {
      const progress = audio.currentTime / (audio.duration || 1);
      const target = Math.floor(progress * totalWords);
      if (target !== wordIndex && target < totalWords) {
        if (wordIndex > 0) {
          wordSpansRef.current[wordIndex - 1].classList.remove("highlight");
          wordSpansRef.current[wordIndex - 1].classList.add("spoken");
        }
        wordSpansRef.current[target].classList.add("highlight");
        wordSpansRef.current[target].scrollIntoView({ behavior: "smooth", block: "nearest" });
        wordIndex = target;
        setAudioProgress(progress * 100);
      }
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setPlayBtnLabel("▶");
      setAudioProgress(100);
      wordSpansRef.current.forEach((s) => s.classList.remove("highlight"));
      URL.revokeObjectURL(url);
    });

    audio.playbackRate = playbackRate;
    audio.play();
    setIsPlaying(true);
    setPlayBtnLabel("⏸");
  }

  function startWebSpeech(text: string) {
    const synth = window.speechSynthesis;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-AR"; utt.rate = 0.85; utt.pitch = 1.0;
    const voices = synth.getVoices();
    const sv = voices.find((v) => v.lang.startsWith("es") && v.name.toLowerCase().includes("google"))
      || voices.find((v) => v.lang.startsWith("es"));
    if (sv) utt.voice = sv;

    wordSpansRef.current.forEach((s) => s.classList.remove("highlight", "spoken"));
    let wordIndex = 0;
    const totalWords = wordSpansRef.current.length;
    const avgMs = (text.length / 4.5) * (1000 / 0.85) / totalWords;

    wordIntervalRef.current = setInterval(() => {
      if (wordIndex > 0) {
        wordSpansRef.current[wordIndex - 1].classList.remove("highlight");
        wordSpansRef.current[wordIndex - 1].classList.add("spoken");
      }
      if (wordIndex < totalWords) {
        wordSpansRef.current[wordIndex].classList.add("highlight");
        setAudioProgress((wordIndex / totalWords) * 100);
        wordIndex++;
      } else {
        if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
      }
    }, avgMs);

    utt.onend = () => {
      setIsPlaying(false);
      setPlayBtnLabel("▶");
      setAudioProgress(100);
      wordSpansRef.current.forEach((s) => s.classList.remove("highlight"));
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    };

    synth.speak(utt);
    setIsPlaying(true);
    setPlayBtnLabel("⏸");
    showToast("🎧 Usando voz del navegador — configurá ElevenLabs para mejor calidad");
  }

  function toggleAudio() {
    if (isPlaying) stopAudio();
    else startAudio();
  }

  // ── Extra activity
  async function generateExtraImage() {
    if (!taskData) return;
    setExtraImageLoading(true);
    setExtraImage(null);
    setShowExtra(true);
    try {
      const base64 = taskData.imageData ? taskData.imageData.split(",")[1] : null;
      const mimeType = taskData.imageData ? taskData.imageData.split(";")[0].split(":")[1] : null;
      const res = await fetch("/api/extra-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          subject: taskData.subject,
          title: taskData.title,
          enunciado: taskData.enunciado,
          childName: activeProfile?.name || "el niño",
          childAge: activeProfile?.age || 8,
          childGrade: activeProfile?.grade || 1,
          childTheme: activeProfile?.themeLabel || "",
          childThemeEmoji: activeProfile?.themeEmoji || "⭐",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageBase64) {
          setExtraImage(`data:${data.mimeType || "image/png"};base64,${data.imageBase64}`);
        } else {
          showToast("⚠️ No se pudo generar la imagen");
        }
      }
    } catch {
      showToast("⚠️ Error generando imagen");
    } finally {
      setExtraImageLoading(false);
    }
  }

  async function generateExtra() {
    if (!taskData) return;
    const profile = activeProfile || { name: "el niño", age: 8, themeLabel: "dinos", themeEmoji: "🦕" } as Profile;
    setExtraText("Generando actividad...");
    setShowExtra(true);

    try {
      const res = await fetch("/api/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: profile.name,
          childAge: profile.age,
          themeLabel: profile.themeLabel,
          taskTitle: taskData.title,
          taskSubject: taskData.subject,
        }),
      });
      const data = await res.json();
      setExtraText(data.text || `${profile.themeEmoji} Dibujá 3 ejemplos del tema usando tu tema favorito: ${profile.themeLabel}.`);
    } catch {
      setExtraText(`${profile.themeEmoji} Dibujá 3 ejemplos de lo que aprendiste hoy usando tu tema favorito: ${profile.themeLabel}. ¡Sé creativo!`);
    }
  }

  // ── Export MP3
  async function exportAudio() {
    const summary = scriptText.trim();
    if (!summary) { showToast("⚠️ Escribí algo en el script primero"); return; }
    setExportLoading(true);
    const voiceKey = activeProfile?.voice || "female";
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: summary, voiceKey }),
    });
    setExportLoading(false);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (taskData?.title || "resumen").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.href = url; a.download = `aprendia_${safeName}.mp3`; a.click();
      URL.revokeObjectURL(url);
      showToast("✅ Audio descargado como MP3");
    } else {
      const synth = window.speechSynthesis;
      const utt = new SpeechSynthesisUtterance(summary);
      utt.lang = "es-AR"; utt.rate = 0.85;
      synth.speak(utt);
      showToast("🎧 Reproduciendo · Configurá ElevenLabs para exportar MP3");
    }
  }

  // ── Print
  function printClean() {
    const title = taskData?.title || "Tarea";
    const subject = taskData?.subject || "";
    const text = taskData?.enunciado || taskData?.text || "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px}h1{font-size:24px;color:#333;margin-bottom:4px}h2{font-size:16px;color:#666;font-weight:normal;margin-bottom:24px}p{font-size:16px;line-height:2.2;color:#333}.line{border-bottom:1px solid #ccc;height:36px}</style></head>
      <body><h1>${title}</h1><h2>${subject}</h2><p>${text.replace(/\n/g, "<br>")}</p>
      <div>${Array(8).fill('<div class="line"></div>').join("")}</div>
      <script>window.print();window.close();<\/script></body></html>`);
  }

  // ── Update pizarra from script
  function updatePizarra() {
    setPizarraText(scriptText);
    showToast("✅ Pizarra actualizada");
  }

  // ─── Render ───────────────────────────────────────────────

  const profileEmoji = activeProfile
    ? activeProfile.themeEmoji || THEME_EMOJIS[activeProfile.theme] || "👤"
    : "👤";

  function handlePin(digit: string) {
    const next = pin + digit;
    setPin(next);
    setPinError(false);
    if (next.length === APP_PIN.length) {
      if (next === APP_PIN) {
        setScreen("home");
        setPin("");
      } else {
        setPinError(true);
        setTimeout(() => { setPin(""); setPinError(false); }, 700);
      }
    }
  }

  if (screen === "lock") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #FFF6EC 0%, #FFF0E0 50%, #FFE8D0 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-body)",
      }}>
        {/* Decoración de fondo */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {["🦕","🚀","⭐","🎨","🌿","🎵","🐬","⚽"].map((e, i) => (
            <div key={i} style={{
              position: "absolute",
              fontSize: `${2 + (i % 3)}rem`,
              opacity: 0.07,
              top: `${10 + (i * 12) % 80}%`,
              left: `${5 + (i * 13) % 90}%`,
              transform: `rotate(${i * 45}deg)`,
            }}>{e}</div>
          ))}
        </div>

        {/* Card central */}
        <div style={{
          position: "relative", zIndex: 1,
          background: "#fff",
          borderRadius: 32,
          padding: "40px 36px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 0 rgba(44,38,71,.06), 0 24px 48px -16px rgba(44,38,71,.18)",
        }}>
          {/* Logo */}
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--ink)", marginBottom: 4 }}>
            Aprend<span style={{ color: "var(--coral)" }}>·</span>IA
          </div>
          <div style={{ fontSize: "3.2rem", margin: "16px 0 8px" }}>📚</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--ink)", marginBottom: 6 }}>
            ¡Hola! Soy tu ayudante de tareas
          </h2>
          <p style={{ fontSize: ".9rem", color: "var(--soft)", marginBottom: 28 }}>
            Ingresá la clave para empezar
          </p>

          {/* Puntos PIN */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 28 }}>
            {Array.from({ length: APP_PIN.length }).map((_, i) => (
              <div key={i} style={{
                width: 18, height: 18,
                borderRadius: "50%",
                background: pinError ? "var(--coral)" : i < pin.length ? "var(--sky)" : "rgba(44,38,71,.12)",
                transition: "background .2s",
                transform: pinError ? "scale(1.2)" : "scale(1)",
              }} />
            ))}
          </div>

          {/* Teclado numérico */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
              <button
                key={i}
                onClick={() => {
                  if (d === "⌫") { setPin(p => p.slice(0, -1)); setPinError(false); }
                  else if (d !== "") handlePin(d);
                }}
                disabled={d === ""}
                style={{
                  height: 62,
                  borderRadius: 16,
                  border: "2px solid rgba(44,38,71,.07)",
                  background: d === "" ? "transparent" : d === "⌫" ? "rgba(44,38,71,.06)" : "#fff",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "var(--ink)",
                  cursor: d === "" ? "default" : "pointer",
                  boxShadow: d === "" ? "none" : "0 3px 0 rgba(44,38,71,.08)",
                  transition: "transform .1s",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "translateY(2px)")}
                onMouseUp={e => (e.currentTarget.style.transform = "")}
              >
                {d}
              </button>
            ))}
          </div>

          {pinError && (
            <p style={{ color: "var(--coral)", fontWeight: 700, fontSize: ".85rem", marginTop: 16 }}>
              Clave incorrecta, intentá de nuevo
            </p>
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: ".75rem", color: "rgba(44,38,71,.3)", position: "relative", zIndex: 1 }}>
          Aprend·IA · v2
        </p>
      </div>
    );
  }

  return (
    <>
      {/* THEME DECORATION */}
      {activeProfile && (
        <div className="theme-decoration">
          {activeProfile.themeEmoji || THEME_EMOJIS[activeProfile.theme] || ""}
        </div>
      )}

      {/* TOAST */}
      <div className={`toast${toastVisible ? " show" : ""}`}>{toast}</div>

      {/* NAV */}
      <nav>
        <div className="logo">Aprend<span>·</span>IA</div>
        <div className="nav-right">
          <button className="btn-profile" onClick={() => setModalOpen(true)}>
            <div className="avatar">{profileEmoji}</div>
            <span>{activeProfile?.name || "Seleccionar niño"}</span>
          </button>
        </div>
      </nav>

      {/* ══ HOME ══ */}
      {screen === "home" && (
        <div id="home">

          {/* Perfil activo */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <p className="section-title" style={{ marginBottom: 6 }}>¿Para quién es la tarea?</p>
            <div className="profiles-row" style={{ justifyContent: "center" }}>
              {profiles.map((p) => {
                const emoji = p.themeEmoji || THEME_EMOJIS[p.theme] || "👤";
                return (
                  <div
                    key={p.name}
                    className={`profile-chip${activeProfile?.name === p.name ? " active" : ""}`}
                    onClick={() => setActiveProfile(p)}
                    style={{ position: "relative", paddingRight: 28 }}
                  >
                    <span className="chip-emoji">{emoji}</span>{p.name}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!confirm(`¿Borrar a ${p.name}?`)) return;
                        const updated = profiles.filter(x => x.name !== p.name);
                        setProfiles(updated);
                        localStorage.setItem("aprendia_profiles", JSON.stringify(updated));
                        if (activeProfile?.name === p.name) setActiveProfile(updated[0] || null);
                      }}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: 0.5, cursor: "pointer", lineHeight: 1 }}
                    >✕</span>
                  </div>
                );
              })}
              <button className="btn-add-profile" onClick={() => setModalOpen(true)}>+ Agregar niño</button>
            </div>
          </div>

          {/* ── SELECTOR DE MODO (sin modo elegido) ── */}
          {!appMode && (
            <div style={{ maxWidth: 680, margin: "0 auto", padding: "8px 20px 32px" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 6 }}>
                  ¿Qué necesitás hoy{activeProfile ? `, ${activeProfile.name}` : ""}?
                </h1>
                <p style={{ color: "#888", fontSize: 15 }}>Elegí una opción para empezar</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Modo 1: Copiar tarea */}
                <button
                  onClick={() => setAppMode("copiar")}
                  style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: 20, padding: "20px 24px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 16px rgba(44,38,71,.07)", transition: "transform .15s, box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(44,38,71,.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,38,71,.07)"; }}
                >
                  <div style={{ fontSize: 44, lineHeight: 1 }}>📋</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--primary)", fontWeight: 700, marginBottom: 3 }}>Copiar tarea</div>
                    <div style={{ fontSize: 14, color: "#666", lineHeight: 1.4 }}>No fui a clase hoy. Sacá la foto del cuaderno del compañero o la fotocopia del profe y generá una copia limpia lista para completar.</div>
                  </div>
                </button>

                {/* Modo 2: Reforzar tema */}
                <button
                  onClick={() => setAppMode("reforzar")}
                  style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: 20, padding: "20px 24px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 16px rgba(44,38,71,.07)", transition: "transform .15s, box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(44,38,71,.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,38,71,.07)"; }}
                >
                  <div style={{ fontSize: 44, lineHeight: 1 }}>🧠</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--sky)", fontWeight: 700, marginBottom: 3 }}>Reforzar un tema</div>
                    <div style={{ fontSize: 14, color: "#666", lineHeight: 1.4 }}>Subí la foto de una tarea o escribí el tema. Aprend·IA genera la explicación y actividades extra personalizadas para {activeProfile?.name || "el niño"}.</div>
                  </div>
                </button>

                {/* Modo 3: Resolver pedidos */}
                <button
                  onClick={() => { setAppMode("pedido"); setScreen("pedido"); }}
                  style={{ background: "linear-gradient(135deg, #f8f4ff 0%, #fff4f9 100%)", border: "2px solid #e8d5ff", borderRadius: 20, padding: "20px 24px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 16px rgba(44,38,71,.07)", transition: "transform .15s, box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(44,38,71,.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,38,71,.07)"; }}
                >
                  <div style={{ fontSize: 44, lineHeight: 1 }}>✨</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "#9b59b6", fontWeight: 700, marginBottom: 3 }}>Resolver un pedido</div>
                    <div style={{ fontSize: 14, color: "#666", lineHeight: 1.4 }}>Pedile lo que necesitás: "Dame una lámina del sistema solar", "Creá ejercicios de suma para 2° grado", "Sopa de letras de animales"...</div>
                  </div>
                </button>
              </div>

              {/* Volver a pizarra anterior */}
              {taskData && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <button className="btn-action btn-secondary" style={{ fontSize: 14 }} onClick={() => { stopAudio(); setScreen("pizarra"); }}>
                    📋 Volver a la pizarra anterior
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MODO COPIAR TAREA ── */}
          {appMode === "copiar" && (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 32px" }}>
              <button className="btn-back" style={{ marginBottom: 16 }} onClick={() => setAppMode(null)}>← Volver</button>
              <h2 style={{ fontFamily: "var(--font-display)", color: "var(--primary)", fontSize: 22, marginBottom: 4 }}>📋 Copiar tarea</h2>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Sacá la foto del cuaderno de un compañero o la fotocopia del profe.</p>
              <div
                className="upload-zone"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
                onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
                onDrop={(e) => { e.currentTarget.classList.remove("dragover"); handleDrop(e); }}
              >
                <input type="file" accept="image/*" onChange={handleFile} />
                <span className="upload-icon">📸</span>
                <h2>Subí la foto de la tarea</h2>
                <p>Cuaderno del compañero, fotocopia del profe, o hoja suelta</p>
              </div>
              <div style={{ background: "#e8f8f0", border: "1px solid #a8e6c0", borderRadius: 12, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#2d7a50" }}>
                💡 Después de analizar la foto vas a poder <strong>descargar la actividad original limpia</strong> lista para completar.
              </div>
            </div>
          )}

          {/* ── MODO REFORZAR TEMA ── */}
          {appMode === "reforzar" && (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 32px" }}>
              <button className="btn-back" style={{ marginBottom: 16 }} onClick={() => setAppMode(null)}>← Volver</button>
              <h2 style={{ fontFamily: "var(--font-display)", color: "var(--sky)", fontSize: 22, marginBottom: 4 }}>🧠 Reforzar un tema</h2>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Subí una foto de la tarea o escribí el tema directamente.</p>
              <div
                className="upload-zone"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
                onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
                onDrop={(e) => { e.currentTarget.classList.remove("dragover"); handleDrop(e); }}
              >
                <input type="file" accept="image/*" onChange={handleFile} />
                <span className="upload-icon">📷</span>
                <h2>Subí la foto de la tarea</h2>
                <p>O usá la opción de texto abajo</p>
              </div>
              <div style={{ textAlign: "center", margin: "14px 0 6px", color: "#aaa", fontWeight: 600, fontSize: 13 }}>— o bien —</div>
              <button
                className="btn-action btn-secondary"
                style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px" }}
                onClick={() => { setLibreText(""); setScreen("libre"); }}
              >
                ✏️ Escribir el tema directamente
              </button>
              <div style={{ background: "#e8f0ff", border: "1px solid #b3c6ff", borderRadius: 12, padding: "10px 14px", marginTop: 14, fontSize: 13, color: "#2d4db5" }}>
                💡 Vas a poder generar una <strong>explicación personalizada</strong> y una <strong>actividad extra para colorear</strong> basada en los gustos de {activeProfile?.name || "el niño"}.
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══ PROCESSING ══ */}
      {screen === "processing" && (
        <div id="processing">
          <div className="processing-card">
            <span className="processing-icon">🔍</span>
            <h2>Analizando la tarea...</h2>
            <p>Aprend·IA está leyendo, limpiando y preparando todo para <strong>{processingFor}</strong>.</p>
            <ul className="steps-list">
              <li id="step1" className="active"><div className="step-icon active">🔍</div>Detectando tipo de hoja...</li>
              <li id="step2"><div className="step-icon">🧹</div>Limpiando imagen...</li>
              <li id="step3"><div className="step-icon">📝</div>Extrayendo texto y enunciado...</li>
              <li id="step4"><div className="step-icon">🧠</div>Generando script pedagógico...</li>
              <li id="step5"><div className="step-icon">✨</div>Preparando la pizarra...</li>
            </ul>
          </div>
        </div>
      )}

      {/* ══ PEDIDOS (CHAT) ══ */}
      {screen === "pedido" && (
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>

          {/* Header fijo */}
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", flexShrink: 0 }}>
            <button className="btn-back" onClick={() => { setScreen("home"); setAppMode(null); setPedidoMessages([]); }}>← Volver</button>
            <h2 style={{ fontFamily: "var(--font-display)", color: "#9b59b6", fontSize: 20, margin: 0, flex: 1 }}>✨ Resolver un pedido</h2>
            {pedidoMessages.length > 0 && (
              <button onClick={() => setPedidoMessages([])}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#999", cursor: "pointer" }}>
                Nueva conversación
              </button>
            )}
          </div>

          {/* Área de mensajes scrollable */}
          <div ref={pedidoChatRef} style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Pantalla vacía con ejemplos */}
            {pedidoMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
                <p style={{ color: "#666", fontSize: 15, marginBottom: 20 }}>
                  Pedile lo que necesitás para {activeProfile?.name || "el niño"}.<br/>
                  <span style={{ fontSize: 13, color: "#aaa" }}>Podés ir refinando el resultado con más mensajes.</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {[
                    "Dame una lámina del sistema solar",
                    `Ejercicios de multiplicación para ${activeProfile?.grade || 2}° grado`,
                    "Sopa de letras con nombres de animales",
                    "Una historia corta sobre dinosaurios",
                    "Tabla del 7 para practicar",
                    `Un crucigrama sobre ${activeProfile?.themeLabel || "la naturaleza"}`,
                  ].map(ex => (
                    <button key={ex} onClick={() => setPedidoText(ex)}
                      style={{ background: "#f3eaff", border: "1px solid #d8b4ff", borderRadius: 20, padding: "8px 16px", fontSize: 13, color: "#7b2eb0", cursor: "pointer" }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes del chat */}
            {pedidoMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                {/* Burbuja de texto */}
                <div style={{
                  maxWidth: "80%",
                  background: msg.role === "user" ? "var(--primary)" : "#f0e8ff",
                  color: msg.role === "user" ? "#fff" : "#333",
                  borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  padding: "10px 16px",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>

                {/* Resultado generado */}
                {msg.result && (
                  <div style={{ width: "100%", border: "2px solid #d8b4ff", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg, #9b59b6, #c0399a)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>✨ Resultado</span>
                      {msg.result.imageBase64 && (
                        <a href={`data:${msg.result.mimeType || "image/png"};base64,${msg.result.imageBase64}`}
                          download="pedido-aprendia.jpg"
                          style={{ background: "rgba(255,255,255,.25)", borderRadius: 20, padding: "4px 12px", color: "#fff", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                          ⬇️ Descargar JPG
                        </a>
                      )}
                      {(msg.result.html || msg.result.text) && (
                        <button onClick={() => {
                          const win = window.open("", "_blank");
                          if (!win) return;
                          win.document.write((msg.result!.html || `<pre style="font-family:Arial;padding:40px;font-size:16px">${msg.result!.text}</pre>`) + `<script>setTimeout(()=>window.print(),400)<\/script>`);
                          win.document.close();
                        }} style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: 20, padding: "4px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          🖨️ Imprimir
                        </button>
                      )}
                    </div>
                    {msg.result.imageBase64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`data:${msg.result.mimeType || "image/png"};base64,${msg.result.imageBase64}`} alt="Resultado" style={{ width: "100%", display: "block" }} />
                    )}
                    {msg.result.html && (
                      <iframe srcDoc={msg.result.html} style={{ width: "100%", minHeight: 420, border: "none", display: "block" }} title="Resultado" />
                    )}
                    {msg.result.text && !msg.result.html && !msg.result.imageBase64 && (
                      <div style={{ background: "#fff", padding: "16px 20px", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.result.text}</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Indicador de carga */}
            {pedidoLoading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ background: "#f0e8ff", borderRadius: "20px 20px 20px 4px", padding: "12px 18px", fontSize: 14, color: "#9b59b6" }}>
                  <span style={{ display: "inline-flex", gap: 4 }}>
                    <span style={{ animation: "bounce 1s infinite 0s" }}>·</span>
                    <span style={{ animation: "bounce 1s infinite .2s" }}>·</span>
                    <span style={{ animation: "bounce 1s infinite .4s" }}>·</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input fijo abajo */}
          <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                style={{ flex: 1, padding: "12px 16px", borderRadius: 20, border: "2px solid var(--border)", fontSize: 15, fontFamily: "var(--font-body)", resize: "none", minHeight: 48, maxHeight: 140, lineHeight: 1.4, boxSizing: "border-box", outline: "none" }}
                placeholder={pedidoMessages.length === 0 ? `Ej: Dame una lámina del sistema solar para ${activeProfile?.grade || 2}° grado...` : "Seguí conversando, corregí o pedí cambios..."}
                value={pedidoText}
                onChange={e => setPedidoText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!pedidoLoading && pedidoText.trim()) document.getElementById("pedido-send")?.click(); }
                }}
                rows={1}
              />
              <button
                id="pedido-send"
                className="btn-action btn-primary"
                style={{ padding: "12px 20px", borderRadius: 20, fontSize: 15, flexShrink: 0 }}
                disabled={pedidoLoading || !pedidoText.trim()}
                onClick={async () => {
                  const userMsg = pedidoText.trim();
                  if (!userMsg) return;
                  setPedidoText("");
                  const newMessages: PedidoMessage[] = [...pedidoMessages, { role: "user", text: userMsg }];
                  setPedidoMessages(newMessages);
                  setPedidoLoading(true);
                  // Scroll al fondo
                  setTimeout(() => { pedidoChatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, 50);
                  try {
                    const res = await fetch("/api/pedido", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: newMessages.map(m => ({ role: m.role, content: m.text })),
                        childName: activeProfile?.name || "",
                        childAge: activeProfile?.age || 8,
                        childGrade: activeProfile?.grade || 1,
                        childTheme: activeProfile?.themeLabel || "",
                        childCountry: activeProfile?.country || "Argentina",
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const assistantText = data.reply || "Acá está lo que generé:";
                      setPedidoMessages(prev => [...prev, { role: "assistant", text: assistantText, result: data.result || undefined }]);
                    } else {
                      setPedidoMessages(prev => [...prev, { role: "assistant", text: "⚠️ No pude generar eso. ¿Podés reformularlo?" }]);
                    }
                  } catch {
                    setPedidoMessages(prev => [...prev, { role: "assistant", text: "⚠️ Hubo un error. Intentá de nuevo." }]);
                  } finally {
                    setPedidoLoading(false);
                    setTimeout(() => { pedidoChatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, 100);
                  }
                }}
              >
                {pedidoLoading ? "⏳" : "➤"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#bbb", margin: "6px 0 0", textAlign: "center" }}>Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      )}

      {/* ══ PIZARRA LIBRE ══ */}
      {screen === "libre" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <button className="btn-back" onClick={() => setScreen("home")}>← Volver</button>
            <h2 style={{ fontFamily: "Fredoka One, cursive", color: "var(--primary)", fontSize: 26, margin: 0 }}>
              ✏️ Pizarra libre
            </h2>
          </div>
          <p style={{ color: "#666", marginBottom: 20, fontSize: 15 }}>
            Escribí el tema, el enunciado o lo que quieras explicar. Claude genera el script pedagógico y podés escucharlo.
          </p>
          <textarea
            className="script-editor"
            style={{ width: "100%", minHeight: 220, fontSize: 16, marginBottom: 16 }}
            placeholder="Ej: Las fracciones — ¿cómo sumar ½ + ¼? &#10;Ej: Hoy repasamos las tablas del 6 y del 7&#10;Ej: El sistema solar tiene 8 planetas..."
            value={libreText}
            onChange={(e) => setLibreText(e.target.value)}
            autoFocus
          />
          <button
            className="btn-action btn-primary"
            style={{ width: "100%", justifyContent: "center", fontSize: 17, padding: "15px" }}
            onClick={generateFromText}
            disabled={libreLoading}
          >
            {libreLoading ? "⏳ Generando script..." : "🧠 Generar pizarra y audio"}
          </button>
        </div>
      )}

      {/* ══ REVISIÓN ══ */}
      {screen === "review" && taskData && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button className="btn-back" onClick={() => setScreen("home")}>← Volver</button>
            <h2 style={{ fontFamily: "Fredoka One, cursive", color: "var(--primary)", fontSize: 24 }}>
              Revisá la tarea antes de mostrarla
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* IMAGEN CON ZOOM Y PAN */}
            <div className="panel-card" style={{ overflow: "hidden", padding: 12 }}>
              <div className="panel-title">📷 Imagen original — zoom y desplazamiento</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button className="btn-action btn-secondary" style={{ padding: "6px 14px" }}
                  onClick={() => setZoom(z => Math.min(z + 0.25, 4))}>+ Zoom</button>
                <button className="btn-action btn-secondary" style={{ padding: "6px 14px" }}
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}>− Zoom</button>
                <button className="btn-action btn-secondary" style={{ padding: "6px 14px" }}
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>↺ Reset</button>
              </div>
              <div
                style={{ overflow: "hidden", cursor: isPanning ? "grabbing" : "grab", height: 480, background: "#111", borderRadius: 10, position: "relative" }}
                onMouseDown={(e) => { setIsPanning(true); panStart.current = { x: e.clientX, y: e.clientY }; panOrigin.current = pan; }}
                onMouseMove={(e) => {
                  if (!isPanning) return;
                  setPan({ x: panOrigin.current.x + e.clientX - panStart.current.x, y: panOrigin.current.y + e.clientY - panStart.current.y });
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => { e.preventDefault(); setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.5), 4)); }}
              >
                {taskData.imageData && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={taskData.imageData}
                    alt="Tarea original"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0, left: 0,
                      maxWidth: "none",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                )}
              </div>
              {taskData.imageData && (
                <button
                  className="btn-action btn-secondary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={() => { setCleanedHtml(null); cleanTraces(); }}
                  disabled={cleanLoading}
                >
                  {cleanLoading ? "⏳ Procesando..." : "⬇️ Descargar actividad original"}
                </button>
              )}

              {/* IMAGEN LIMPIA (Gemini) */}
              {cleanedImage && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cleanedImage} alt="Actividad limpia" style={{ width: "100%", borderRadius: 12, display: "block", border: "2px solid var(--grass)" }} />
                  <a
                    href={cleanedImage}
                    download="actividad-original.jpg"
                    className="btn-action btn-green"
                    style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
                  >⬇️ Descargar JPG</a>
                </div>
              )}

              {/* VISTA PREVIA LIMPIA (fallback HTML) */}
              {cleanedHtml !== null && (
                <div style={{ marginTop: 14, border: "2px solid var(--grass)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ background: "var(--grass)", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>✅ Documento limpio</span>
                    <button
                      onClick={() => {
                        const win = window.open("", "_blank");
                        if (!win) return;
                        win.document.write(cleanedHtml + `<script>setTimeout(() => window.print(), 400);<\/script>`);
                        win.document.close();
                      }}
                      style={{ background: "rgba(255,255,255,.25)", border: "none", borderRadius: 20, padding: "5px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                    >🖨️ Imprimir / Descargar PDF</button>
                  </div>
                  <div style={{ background: "#fff", maxHeight: 320, overflowY: "auto" }}>
                    <iframe
                      srcDoc={cleanedHtml}
                      style={{ width: "100%", height: 300, border: "none" }}
                      title="Documento limpio"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TEXTO EDITABLE */}
            <div className="panel-card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="panel-title">✏️ Enunciado detectado — editá si hay errores</div>
              <textarea
                className="script-editor"
                style={{ flex: 1, minHeight: 380, fontSize: 16 }}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="El texto detectado aparece aquí..."
              />
              <div style={{ position: "sticky", bottom: 0, background: "var(--surface)", paddingTop: 12, marginTop: 12 }}>
                <button
                  className="btn-action btn-primary"
                  style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px" }}
                  onClick={confirmReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "⏳ Generando script..." : "✅ Confirmar y ver pizarra"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PIZARRA ══ */}
      {screen === "pizarra" && taskData && (
        <div id="pizarra">
          <div className="pizarra-header">
            <div className="pizarra-meta">
              <button className="btn-back" onClick={() => { stopAudio(); setScreen("home"); }}>← Volver</button>
              <span
                className="task-type"
                style={{ cssText: taskData.typeCss } as React.CSSProperties}
              >
                {taskData.type || `📚 ${taskData.subject || "Tarea"}`}
              </span>
            </div>
            <div className="pizarra-actions">
              <button className="btn-action btn-secondary" onClick={printClean}>🖨️ Imprimir limpia</button>
              <button
                className="btn-action"
                style={{ background: useUppercase ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.15)", color: "white", padding: "6px 12px", fontSize: 13, fontWeight: 700 }}
                onClick={() => setUseUppercase(u => !u)}
                title="Cambiar entre mayúsculas y minúsculas"
              >AA {useUppercase ? "Imprenta" : "cursiva"}</button>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Actividad extra:</span>
                <button
                  className="btn-action"
                  style={{ background: extraMode === "text" ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.15)", color: "white", padding: "6px 12px", fontSize: 13 }}
                  onClick={() => { setExtraMode("text"); setExtraImage(null); generateExtra(); }}
                >📝 Texto</button>
                <button
                  className="btn-action"
                  style={{ background: extraMode === "image" ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.15)", color: "white", padding: "6px 12px", fontSize: 13 }}
                  onClick={() => { setExtraMode("image"); setExtraText(""); generateExtraImage(); }}
                  disabled={extraImageLoading}
                >{extraImageLoading ? "⏳" : "🎨"} Para colorear</button>
              </div>
              <button className="btn-action btn-green" onClick={exportAudio} disabled={exportLoading}>
                {exportLoading ? "⏳ Generando..." : "🎧 Exportar audio"}
              </button>
            </div>
          </div>

          <div className="pizarra-layout">
            {/* BLACKBOARD */}
            <div>
              <div className="blackboard">
                <div className="blackboard-frame" />
                <div className="blackboard-content">
                  <div
                    className="bb-subject"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setTaskData(d => d ? { ...d, subject: e.currentTarget.innerText } : d)}
                    style={{ outline: "none", cursor: "text" }}
                  >{taskData.subject}</div>
                  <div
                    className="bb-title"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setTaskData(d => d ? { ...d, title: e.currentTarget.innerText } : d)}
                    style={{ outline: "none", cursor: "text" }}
                  >{taskData.title}</div>
                  <div className="bb-divider" />
                  <div
                    className="bb-text"
                    ref={bbTextRef}
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={() => { isEditingPizarra.current = true; stopAudio(); }}
                    onBlur={(e) => {
                      isEditingPizarra.current = false;
                      const newText = e.currentTarget.innerText;
                      setPizarraText(newText);
                    }}
                    style={{ outline: "none", minHeight: 40, cursor: "text", textTransform: useUppercase ? "uppercase" : "none", letterSpacing: useUppercase ? "0.04em" : "normal" }}
                    title="Hacé click para editar el texto de la pizarra"
                  />
                  <div className="audio-bar">
                    <button className="btn-play" onClick={toggleAudio}>{playBtnLabel}</button>
                    <div className="audio-info">
                      <div className="audio-label">Escuchar enunciado</div>
                      <div className="audio-progress">
                        <div className="audio-progress-fill" style={{ width: `${audioProgress}%` }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0.6, 0.8, 1.0].map((r) => (
                        <button
                          key={r}
                          onClick={() => setPlaybackRate(r)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 20,
                            border: "none",
                            background: playbackRate === r ? "var(--primary)" : "rgba(255,255,255,0.15)",
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {r === 0.6 ? "🐢" : r === 0.8 ? "normal" : "rápido"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* EXTRA */}
              {showExtra && (
                <div className="extra-card">
                  <h3>⭐ Actividad extra para vos</h3>
                  {extraMode === "text" && <p>{extraText}</p>}
                  {extraMode === "image" && (
                    <div>
                      {extraImageLoading && <p style={{ opacity: 0.7 }}>⏳ Generando imagen para colorear...</p>}
                      {extraImage && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={extraImage} alt="Actividad para colorear" style={{ width: "100%", borderRadius: 12, border: "3px solid rgba(255,255,255,.3)" }} />
                          <a
                            href={extraImage}
                            download="actividad-colorear.jpg"
                            className="btn-action"
                            style={{ background: "rgba(255,255,255,.25)", color: "white", justifyContent: "center", textDecoration: "none" }}
                          >⬇️ Descargar para imprimir</a>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    className="btn-action"
                    style={{ background: "rgba(255,255,255,0.25)", color: "white", marginTop: 10 }}
                    onClick={() => { setShowExtra(false); setExtraImage(null); }}
                  >Cerrar</button>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="sidebar-panel">
              <div className="panel-card">
                <div className="panel-title">📷 Imagen original</div>
                {taskData.imageData && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="img-preview" src={taskData.imageData} alt="Tarea original" />
                )}
                <div className="tag-row">
                  {taskData.tags
                    ? taskData.tags.map((t, i) => (
                        <span key={i} className="tag" style={{ cssText: t.css } as React.CSSProperties}>{t.text}</span>
                      ))
                    : taskData.imageType && (
                        <span className="tag" style={{ background: "#EEF0FF", color: "#4B44CC" }}>
                          📄 {taskData.imageType.replace(/_/g, " ")}
                        </span>
                      )}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-title">✏️ Script pedagógico</div>
                <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#7c6000", marginBottom: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span>⚠️</span>
                  <span>Este contenido es generado por IA y puede tener errores. Revisalo antes de mostrárselo al niño.</span>
                </div>
                <textarea
                  className="script-editor"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Escribí o editá el texto que quierás convertir a audio..."
                />
                <button
                  className="btn-action btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={updatePizarra}
                >↻ Actualizar pizarra</button>
                <button
                  className="btn-action btn-green"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  onClick={exportAudio}
                  disabled={exportLoading}
                >🎧 {exportLoading ? "Generando..." : "Exportar script como audio"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROFILE MODAL ══ */}

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <h2>Nuevo perfil 🎨</h2>

            <div className="form-group">
              <label>Nombre del niño/a</label>
              <input type="text" placeholder="Ej: Tomás" maxLength={20} value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Edad</label>
                <input type="number" placeholder="Ej: 8" min={4} max={16} value={formAge} onChange={(e) => setFormAge(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Grado escolar</label>
                <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, background: "var(--surface)", color: "var(--text)" }}>
                  <option value="1">1° grado</option>
                  <option value="2">2° grado</option>
                  <option value="3">3° grado</option>
                  <option value="4">4° grado</option>
                  <option value="5">5° grado</option>
                  <option value="6">6° grado</option>
                  <option value="7">7° grado</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>País donde estudia</label>
              <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, background: "var(--surface)", color: "var(--text)" }}>
                <option>Argentina</option>
                <option>México</option>
                <option>Colombia</option>
                <option>Chile</option>
                <option>España</option>
                <option>Uruguay</option>
                <option>Perú</option>
                <option>Venezuela</option>
                <option>Ecuador</option>
                <option>Bolivia</option>
                <option>Paraguay</option>
                <option>Guatemala</option>
                <option>Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Voz del asistente</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                <button
                  className={`voice-option${formVoice === "female" ? " selected" : ""}`}
                  onClick={() => setFormVoice("female")}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>👩</div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Femenina</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Matilda · cálida</div>
                </button>
                <button
                  className={`voice-option${formVoice === "male" ? " selected" : ""}`}
                  onClick={() => setFormVoice("male")}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>👨</div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Masculina</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Will · sereno</div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Tema favorito</label>
              <div className="themes-grid">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    className={`theme-option${!isCustomTheme && formTheme === t.key ? " selected" : ""}`}
                    onClick={() => { setFormTheme(t.key); setIsCustomTheme(false); }}
                  >
                    <span className="theme-emoji">{t.emoji}</span>{t.label}
                  </button>
                ))}
              </div>
              <div className={`custom-theme-row${isCustomTheme ? " active" : ""}`} onClick={() => setIsCustomTheme(true)}>
                <input
                  type="text"
                  className="custom-emoji-input"
                  maxLength={2}
                  placeholder="✏️"
                  value={customEmoji}
                  onChange={(e) => { setCustomEmoji(e.target.value); setIsCustomTheme(true); }}
                />
                <label style={{ fontWeight: 800, fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Otro:</label>
                <input
                  type="text"
                  placeholder="Escribí el tema favorito del niño..."
                  maxLength={30}
                  value={customTheme}
                  style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Nunito, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text)" }}
                  onChange={(e) => { setCustomTheme(e.target.value); setIsCustomTheme(true); }}
                  onFocus={() => setIsCustomTheme(true)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              {profiles.find(p => p.name === formName) && (
                <button
                  className="btn-cancel"
                  style={{ color: "var(--coral)", borderColor: "var(--coral)" }}
                  onClick={() => {
                    const updated = profiles.filter(p => p.name !== formName);
                    setProfiles(updated);
                    localStorage.setItem("aprendia_profiles", JSON.stringify(updated));
                    if (activeProfile?.name === formName) setActiveProfile(updated[0] || null);
                    setModalOpen(false);
                    showToast(`🗑️ Perfil de ${formName} eliminado`);
                  }}
                >Eliminar</button>
              )}
              <button className="btn-save" onClick={saveProfile}>Guardar ✨</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
