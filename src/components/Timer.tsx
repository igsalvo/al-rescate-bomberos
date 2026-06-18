import { useEffect, useState } from "react";

export function Timer({ running, resetKey }: { running: boolean; resetKey: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  return (
    <div className="timer" aria-live="polite" aria-label={`Tiempo de decisión ${seconds} segundos`}>
      <span>Decisión</span>
      <strong>{seconds}s</strong>
    </div>
  );
}
