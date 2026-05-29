"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────

interface Profile {
  name: string;
  age: number;
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

type Screen = "home" | "processing" | "pizarra";

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
  const [screen, setScreen] = useState<Screen>("home");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [pizarraText, setPizarraText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playBtnLabel, setPlayBtnLabel] = useState("▶");
  const [audioProgress, setAudioProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [processingFor, setProcessingFor] = useState("el niño");

  // profile form
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
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

  async function analyzeWithClaude(imageData: string) {
    try {
      const base64 = imageData.split(",")[1];
      const mimeType = imageData.split(";")[0].split(":")[1];

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) throw new Error("analyze failed");
      const result: TaskData = await res.json();
      result.imageData = imageData;
      showPizarra(result);
    } catch (err) {
      console.error(err);
      showPizarra({ ...DEMO.math, imageData: undefined });
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

  // ── Word spans
  useEffect(() => {
    if (screen !== "pizarra" || !bbTextRef.current) return;
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
    const summary = taskData?.summary;
    if (!summary) { showToast("⚠️ No hay resumen para exportar"); return; }
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
          <div className="hero">
            <h1>Tu tarea,<br /><span>clara y simple.</span></h1>
            <p>Subí la foto de la tarea y Aprend·IA la convierte en una pizarra lista para aprender.</p>
          </div>

          {/* Upload */}
          <div
            className="upload-zone"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
            onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
            onDrop={(e) => { e.currentTarget.classList.remove("dragover"); handleDrop(e); }}
          >
            <input type="file" accept="image/*" onChange={handleFile} />
            <span className="upload-icon">📸</span>
            <h2>Subí la foto de la tarea</h2>
            <p>Fotocopia del profe, hoja del compañero, o cualquier tarea manuscrita</p>
          </div>

          {/* Profiles */}
          <p className="section-title">¿Para quién es la tarea?</p>
          <div className="profiles-row">
            {profiles.map((p) => {
              const emoji = p.themeEmoji || THEME_EMOJIS[p.theme] || "👤";
              return (
                <div
                  key={p.name}
                  className={`profile-chip${activeProfile?.name === p.name ? " active" : ""}`}
                  onClick={() => setActiveProfile(p)}
                >
                  <span className="chip-emoji">{emoji}</span>{p.name}
                </div>
              );
            })}
            <button className="btn-add-profile" onClick={() => setModalOpen(true)}>+ Agregar niño</button>
          </div>

          {/* Recent tasks */}
          <p className="section-title">Tareas recientes</p>
          <div className="tasks-grid">
            <div className="task-card" onClick={() => loadDemo("math")}>
              <div className="task-card-badge badge-math">🔢 Matemática</div>
              <h3>Comparamos números</h3>
              <p>10 de abril · Tomás</p>
            </div>
            <div className="task-card" onClick={() => loadDemo("lang")}>
              <div className="task-card-badge badge-lang">📖 Lengua</div>
              <h3>Sinónimos y antónimos</h3>
              <p>12 de noviembre · Renata</p>
            </div>
            <div className="task-card" onClick={() => loadDemo("sci")}>
              <div className="task-card-badge badge-sci">🔬 Ciencias</div>
              <h3>El agua en Argentina 1810</h3>
              <p>20 de mayo · Tomás</p>
            </div>
          </div>
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
              <button className="btn-action btn-accent" onClick={generateExtra}>⭐ Actividad extra</button>
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
                  <div className="bb-subject">{taskData.subject}</div>
                  <div className="bb-title">{taskData.title}</div>
                  <div className="bb-divider" />
                  <div className="bb-text" ref={bbTextRef} />
                  <div className="audio-bar">
                    <button className="btn-play" onClick={toggleAudio}>{playBtnLabel}</button>
                    <div className="audio-info">
                      <div className="audio-label">Escuchar enunciado</div>
                      <div className="audio-progress">
                        <div className="audio-progress-fill" style={{ width: `${audioProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXTRA */}
              {showExtra && (
                <div className="extra-card">
                  <h3>⭐ Actividad extra para vos</h3>
                  <p>{extraText}</p>
                  <button
                    className="btn-action"
                    style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
                    onClick={() => setShowExtra(false)}
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
                <textarea
                  className="script-editor"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="El script generado aparecerá aquí para que puedas editarlo..."
                />
                <button
                  className="btn-action btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={updatePizarra}
                >↻ Actualizar pizarra</button>
              </div>

              <div className="panel-card">
                <div className="panel-title">📋 Resumen del tema</div>
                <div className="summary-text">{taskData.summary || "El resumen aparecerá aquí..."}</div>
                <button
                  className="btn-action btn-green"
                  style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                  onClick={exportAudio}
                >🎧 Exportar resumen como audio</button>
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

            <div className="form-group">
              <label>Edad</label>
              <input type="number" placeholder="Ej: 8" min={4} max={16} value={formAge} onChange={(e) => setFormAge(e.target.value)} />
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
              <button className="btn-save" onClick={saveProfile}>Guardar perfil ✨</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
