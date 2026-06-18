import { Route, Shield, Users, Volume2 } from "lucide-react";
import type { GameMode } from "../game/types";
import { AudioControls } from "./AudioControls";

export function StartScreen({
  mode,
  setMode,
  teamName,
  setTeamName,
  soundEnabled,
  setSoundEnabled,
  onStart,
  onDifficulty
}: {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  teamName: string;
  setTeamName: (name: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onStart: () => void;
  onDifficulty: () => void;
}) {
  return (
    <main className="start-screen">
      <section className="hero-map" aria-hidden="true">
        <svg viewBox="0 0 900 620">
          <rect width="900" height="620" fill="#0b3a66" />
          <path d="M0 130 C180 190 275 95 435 145 S720 220 900 110" stroke="#73d2de" strokeWidth="28" fill="none" opacity=".9" />
          <path d="M90 475 C230 360 380 445 520 330 S730 305 850 210" stroke="#f8c537" strokeWidth="18" fill="none" />
          <path d="M55 250 H790 M160 95 V560 M360 90 V560 M610 70 V545" stroke="#eef7f8" strokeWidth="18" opacity=".55" />
          <circle cx="160" cy="250" r="35" fill="#e5383b" />
          <rect x="575" y="282" width="78" height="46" rx="9" fill="#e5383b" />
          <circle cx="596" cy="332" r="12" fill="#111827" />
          <circle cx="635" cy="332" r="12" fill="#111827" />
          <path d="M720 184 l24 44 h-48z" fill="#ffbe0b" />
        </svg>
      </section>
      <section className="start-content">
        <div className="brand-row">
          <div className="logo-slot">Logo</div>
          <span>Ingenieria Industrial · Universidad de Chile</span>
        </div>
        <h1>¡Al rescate! Ayuda a Bomberos a llegar a tiempo</h1>
        <p className="subtitle">¿Podras elegir el carro y la ruta mas rapida?</p>
        <p>Selecciona un carro, elige una ruta y llega a la emergencia lo antes posible. Observa el trafico, los cortes de calle y otros obstaculos.</p>

        <div className="mode-switch" role="group" aria-label="Modalidad">
          <button className={mode === "individual" ? "selected" : ""} type="button" onClick={() => setMode("individual")}>
            Individual
          </button>
          <button className={mode === "team" ? "selected" : ""} type="button" onClick={() => setMode("team")}>
            Equipo
          </button>
        </div>
        {mode === "team" ? (
          <label className="team-input">
            Nombre del equipo
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} maxLength={28} placeholder="Opcional" />
          </label>
        ) : null}

        <div className="instruction-row">
          <span>
            <Shield aria-hidden="true" /> Elige carro
          </span>
          <span>
            <Route aria-hidden="true" /> Decide ruta
          </span>
          <span>
            <Users aria-hidden="true" /> Aprende jugando
          </span>
          <span>
            <Volume2 aria-hidden="true" /> Sonidos suaves
          </span>
        </div>

        <div className="action-row">
          <button className="primary" type="button" onClick={onStart}>
            Jugar recorrido completo
          </button>
          <button className="secondary" type="button" onClick={onDifficulty}>
            Elegir dificultad
          </button>
          <AudioControls enabled={soundEnabled} onChange={setSoundEnabled} />
        </div>
      </section>
    </main>
  );
}
