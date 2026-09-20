type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return ctor() !== null;
}

/** Listen once and return the recognised sentence. */
export function listenOnce(
  lang: "en" | "hi",
  onText: (text: string) => void,
  onEnd: () => void,
): (() => void) | null {
  const C = ctor();
  if (!C) return null;
  const rec = new C();
  rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = (e) => {
    const text = e.results[0]?.[0]?.transcript ?? "";
    if (text) onText(text);
  };
  rec.onerror = onEnd;
  rec.onend = onEnd;
  rec.start();
  return () => rec.stop();
}

export function speak(text: string, lang: "en" | "hi") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}
