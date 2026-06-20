import { useCallback, useRef, useState } from "react";

type SoundName = "select" | "blocked" | "arrival" | "result" | "alarm";

export function useAudio() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("industrial-games-sound") !== "off");
  const audioContext = useRef<AudioContext | null>(null);
  const siren = useRef<OscillatorNode | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    if (audioContext.current.state === "suspended") void audioContext.current.resume();
    return audioContext.current;
  }, []);

  const setSound = useCallback((value: boolean) => {
    setEnabled(value);
    localStorage.setItem("industrial-games-sound", value ? "on" : "off");
  }, []);

  const beep = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      const context = ensureAudio();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const settings = {
        select: [560, 0.08],
        blocked: [160, 0.16],
        arrival: [760, 0.2],
        result: [460, 0.22],
        alarm: [620, 0.18]
      } satisfies Record<SoundName, [number, number]>;
      oscillator.frequency.value = settings[name][0];
      oscillator.type = name === "blocked" ? "sawtooth" : "sine";
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + settings[name][1]);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + settings[name][1] + 0.02);
    },
    [enabled, ensureAudio]
  );

  const startSiren = useCallback(() => {
    if (!enabled || siren.current) return;
    const context = ensureAudio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 420;
    gain.gain.value = 0.035;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    siren.current = oscillator;
    let high = false;
    const interval = window.setInterval(() => {
      if (!siren.current) {
        window.clearInterval(interval);
        return;
      }
      high = !high;
      siren.current.frequency.setTargetAtTime(high ? 640 : 420, context.currentTime, 0.05);
    }, 420);
  }, [enabled, ensureAudio]);

  const stopSiren = useCallback(() => {
    siren.current?.stop();
    siren.current = null;
  }, []);

  return { enabled, setSound, beep, startSiren, stopSiren, ensureAudio };
}
