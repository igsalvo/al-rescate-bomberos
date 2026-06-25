import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Medal, Play, Plus, RotateCcw, Trophy, Users } from "lucide-react";
import { gameBySlug, games, type GameDefinition } from "../config/games";
import { gameInstructions } from "../config/instructions";
import { levels } from "../game/levels";
import type { LevelResultData } from "../game/types";
import { useAudio } from "../hooks/useAudio";
import { useGameState } from "../hooks/useGameState";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { navigate } from "../lib/router";
import { DifficultySelector } from "./DifficultySelector";
import { EducationalGame, type EducationalResult } from "./EducationalGame";
import { FinalResult } from "./FinalResult";
import { GameMap } from "./GameMap";
import { InstructionModal } from "./InstructionModal";
import { LevelResult } from "./LevelResult";
import { PlatformHeader } from "./PlatformHeader";
import { StartScreen } from "./StartScreen";

type SimulationEntry = {
  id: string;
  name: string;
  score: number;
  title: string;
  detail: string;
};

function storageKey(gameId: string) {
  return `presential-simulation:${gameId}`;
}

function loadEntries(gameId: string) {
  try {
    const raw = window.localStorage.getItem(storageKey(gameId));
    return raw ? JSON.parse(raw) as SimulationEntry[] : [];
  } catch {
    return [];
  }
}

function GamePicker({ onChoose }: { onChoose: (game: GameDefinition) => void }) {
  return <main className="simulation-page">
    <section className="simulation-hero">
      <div>
        <p className="eyebrow">Modo presencial</p>
        <h1>Simulaciones para actividades en sala</h1>
        <p>Ingresa participantes uno a uno, ejecuta el mismo juego con su animación y compara los resultados en tiempo real.</p>
      </div>
      <div className="simulation-hero-badge"><Users aria-hidden="true" /><strong>Ranking vivo</strong><span>Podio final animado</span></div>
    </section>
    <section className="simulation-picker" aria-label="Elegir juego para simular">
      {games.filter((game) => game.enabled).map((game) => (
        <button type="button" className="simulation-game-card" onClick={() => onChoose(game)} key={game.id}>
          <span>{game.icon}</span>
          <strong>{game.title}</strong>
          <small>{game.categories.slice(0, 2).join(" · ")}</small>
          <i><Play size={16} aria-hidden="true" />Simular actividad</i>
        </button>
      ))}
    </section>
  </main>;
}

function LiveBoard({ entries, onPodium }: { entries: SimulationEntry[]; onPodium: () => void }) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return <aside className="simulation-board" aria-label="Resultados en vivo">
    <div className="simulation-board-head">
      <div><small>Resultados en vivo</small><strong>{entries.length} participantes</strong></div>
      <button type="button" className="primary" disabled={entries.length < 1} onClick={onPodium}><Trophy aria-hidden="true" />Ver ganadores</button>
    </div>
    <ol>
      {sorted.map((entry, index) => (
        <li key={entry.id} className={index < 3 ? `rank-${index + 1}` : ""}>
          <span>{index + 1}</span>
          <div><strong>{entry.name}</strong><small>{entry.detail}</small></div>
          <b>{entry.score}</b>
        </li>
      ))}
    </ol>
    {!entries.length && <p className="empty-board">Aún no hay resultados. Ingresa el primer nombre para iniciar.</p>}
  </aside>;
}

function Podium({ entries, onClose }: { entries: SimulationEntry[]; onClose: () => void }) {
  const top = [...entries].sort((a, b) => b.score - a.score).slice(0, 3);
  const byPlace = [top[1], top[0], top[2]];
  return <div className="podium-overlay" role="dialog" aria-modal="true" aria-label="Ganadores de la actividad">
    <section className="podium-modal">
      <div className="podium-title"><Medal aria-hidden="true" /><div><p className="eyebrow">Ganadores</p><h2>Podio de la actividad</h2></div></div>
      <div className="podium-stage">
        {byPlace.map((entry, index) => {
          const place = index === 0 ? 2 : index === 1 ? 1 : 3;
          return <article className={`podium-place place-${place}`} key={entry?.id ?? place}>
            <div className="podium-medal">{place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉"}</div>
            <strong>{entry?.name ?? "Sin participante"}</strong>
            <span>{entry ? `${entry.score} pts` : "-"}</span>
            <i>{place}</i>
          </article>;
        })}
      </div>
      <div className="podium-actions"><button type="button" className="secondary" onClick={onClose}>Volver al ranking</button></div>
    </section>
  </div>;
}

function BomberosSimulationGame({ audio, onCatalog, onResult }: { audio: ReturnType<typeof useAudio>; onCatalog: () => void; onResult: (result: EducationalResult) => void }) {
  const game = useGameState();
  const reducedMotion = useReducedMotion();
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const submitted = useRef("");
  useEffect(() => {
    if (game.screen !== "finalResult" || !game.results.length) return;
    const marker = game.results.map((result) => result.score).join("-");
    if (submitted.current === marker) return;
    submitted.current = marker;
    const average = Math.round(game.totals.score / game.results.length);
    onResult({
      score: average * 10,
      title: average >= 90 ? "Despacho de podio" : "Respuesta completada",
      metrics: [["Promedio", `${average}/100`], ["Niveles", game.results.length], ["Tiempo total", `${game.totals.playerTime}s`]],
      explanation: "La simulación comparó selección de carro, ruta, tiempo y seguridad en cada emergencia."
    });
  }, [game.results, game.screen, game.totals.playerTime, game.totals.score, onResult]);
  const wrap = (content: ReactNode) => <>{content}<button className="floating-help" type="button" onClick={() => setInstructionsOpen(true)}>¿Cómo jugar?</button><InstructionModal open={instructionsOpen} title="¡Al rescate!" icon="🚒" instructions={gameInstructions.bomberos} onClose={() => setInstructionsOpen(false)} /></>;
  if (game.screen === "difficulty") return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll} /><DifficultySelector onChoose={game.chooseDifficulty} onBack={() => game.setScreen("start")} /></>);
  if (game.screen === "playing") return wrap(<GameMap key={game.level.id} level={game.level} soundEnabled={audio.enabled} setSoundEnabled={audio.setSound} onBeep={audio.beep} startSiren={audio.startSiren} stopSiren={audio.stopSiren} reducedMotion={reducedMotion} onBack={onCatalog} onRestart={game.resetAll} onFinish={(params) => game.finishLevel({ ...params, level: game.level })} />);
  if (game.screen === "levelResult" && game.latestResult) return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll} /><LevelResult result={game.latestResult} hasNext={game.completeRun && game.results.length < levels.length} onNext={game.nextLevel} onRetry={game.retryLevel} onHome={onCatalog} /></>);
  if (game.screen === "finalResult") return wrap(<><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onCatalog} onRestart={game.resetAll} /><FinalResult results={game.results as LevelResultData[]} totals={game.totals} onRestart={game.startComplete} onHome={onCatalog} /></>);
  return wrap(<div className="with-floating-back"><button className="floating-back" type="button" onClick={onCatalog}>← Volver al panel</button><StartScreen onStart={() => { audio.ensureAudio(); audio.beep("alarm"); game.startComplete(); }} /></div>);
}

export function SimulationMode({ slug, audio, onHome }: { slug?: string; audio: ReturnType<typeof useAudio>; onHome: () => void }) {
  const selected = slug ? gameBySlug(slug) : undefined;
  const [entries, setEntries] = useState<SimulationEntry[]>(() => selected ? loadEntries(selected.id) : []);
  const [participantName, setParticipantName] = useState("");
  const [activeRun, setActiveRun] = useState<{ id: string; name: string } | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [showPodium, setShowPodium] = useState(false);
  const recorded = useRef(new Set<string>());

  useEffect(() => {
    if (!selected) return;
    const next = loadEntries(selected.id);
    setEntries(next);
    setActiveRun(null);
    setParticipantName("");
    setShowPodium(false);
    recorded.current = new Set(next.map((entry) => entry.id));
  }, [selected?.id]);

  useEffect(() => {
    if (selected) window.localStorage.setItem(storageKey(selected.id), JSON.stringify(entries));
  }, [entries, selected]);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.score - a.score), [entries]);
  const startRun = () => {
    const name = participantName.trim();
    if (!name) return;
    setActiveRun({ id: crypto.randomUUID(), name });
    setRunKey((value) => value + 1);
  };
  const record = (result: EducationalResult) => {
    if (!activeRun || recorded.current.has(activeRun.id)) return;
    recorded.current.add(activeRun.id);
    setEntries((current) => [...current, {
      id: activeRun.id,
      name: activeRun.name,
      score: result.score,
      title: result.title,
      detail: result.metrics[0] ? `${result.title} · ${result.metrics[0][1]}` : result.title
    }]);
  };
  const nextParticipant = () => {
    setActiveRun(null);
    setParticipantName("");
    setRunKey((value) => value + 1);
  };
  const clearActivity = () => {
    setEntries([]);
    setShowPodium(false);
    recorded.current = new Set();
  };

  if (!selected) return <div className="catalog-page"><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={onHome} /><GamePicker onChoose={(game) => navigate(`/simulaciones/${game.slug}`)} /></div>;
  if (!selected.enabled) return <main className="not-found"><h1>Juego no disponible</h1><button className="primary" onClick={() => navigate("/simulaciones")}>Volver a simulaciones</button></main>;

  if (activeRun) return <div className={`game-page theme-${selected.id}`}>
    <div className="simulation-run-bar">
      <button type="button" className="secondary" onClick={nextParticipant}><ArrowLeft aria-hidden="true" />Panel</button>
      <div><small>Participante en simulación</small><strong>{activeRun.name}</strong></div>
      <button type="button" className="primary" onClick={nextParticipant} disabled={!entries.some((entry) => entry.id === activeRun.id)}><Plus aria-hidden="true" />Siguiente participante</button>
    </div>
    {selected.id === "bomberos"
      ? <BomberosSimulationGame key={runKey} audio={audio} onCatalog={nextParticipant} onResult={record} />
      : <><PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={nextParticipant} /><EducationalGame key={runKey} game={selected} onHome={nextParticipant} onSimulationResult={record} /></>}
  </div>;

  return <div className="catalog-page">
    <PlatformHeader sound={audio.enabled} onSound={audio.setSound} onBack={() => navigate("/simulaciones")} />
    <main className="simulation-console">
      <section className="simulation-setup">
        <button type="button" className="back-link" onClick={() => navigate("/simulaciones")}><ArrowLeft size={18} aria-hidden="true" />Cambiar juego</button>
        <div className="simulation-game-heading"><span>{selected.icon}</span><div><p className="eyebrow">Simulación presencial</p><h1>{selected.title}</h1><p>{selected.fullDescription}</p></div></div>
        <form className="participant-form" onSubmit={(event) => { event.preventDefault(); startRun(); }}>
          <label>Nombre del participante o equipo<input value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Ej: Equipo Azul" autoFocus /></label>
          <button type="submit" className="primary" disabled={!participantName.trim()}><Play aria-hidden="true" />Entrar a simular</button>
        </form>
        <div className="simulation-actions">
          <button type="button" className="secondary" disabled={!entries.length} onClick={clearActivity}><RotateCcw aria-hidden="true" />Reiniciar actividad</button>
          <button type="button" className="primary" disabled={!entries.length} onClick={() => setShowPodium(true)}><Trophy aria-hidden="true" />Ver ganadores</button>
        </div>
        {sorted[0] && <article className="leader-card">
          <small>Líder actual</small>
          <strong>{sorted[0].name}</strong>
          <span>{sorted[0].score} pts</span>
          <p>{sorted[0].title}. El ranking se actualiza automáticamente al terminar cada simulación.</p>
        </article>}
      </section>
      <LiveBoard entries={entries} onPodium={() => setShowPodium(true)} />
    </main>
    {showPodium && <Podium entries={entries} onClose={() => setShowPodium(false)} />}
  </div>;
}
