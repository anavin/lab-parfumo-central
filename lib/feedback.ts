// Short WebAudio beep for scan confirmation. iOS Safari ignores navigator.vibrate,
// so a beep is the only non-visual feedback there. Fail-soft: if audio is blocked
// (no user gesture yet, unsupported), it silently no-ops and vibrate still fires.
let ctx: AudioContext | null = null;

export function beep(kind: "ok" | "error" = "ok"): void {
  try {
    const AC = (typeof window !== "undefined") && (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const dur = kind === "error" ? 0.3 : 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = kind === "error" ? 240 : 880;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now); osc.stop(now + dur);
  } catch { /* audio unavailable — visual + vibrate still convey the result */ }
}
