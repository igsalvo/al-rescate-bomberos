import { useEffect, useRef, useState } from "react";
import { clampScore } from "../game/common";
import type { EducationalDifficulty } from "./GameDifficultySelector";

type GameResult = { score: number; title: string; metrics: Array<[string, string | number]>; explanation: string };

const easyLevels = [
  { items: ["●", "●", "■", "●", "●"], odd: 2, clue: "La forma no coincide" },
  { items: ["▲", "▲", "▲", "△", "▲"], odd: 3, clue: "El relleno es diferente" },
  { items: ["◆", "◆", "◈", "◆", "◆"], odd: 2, clue: "Combina borde y centro" }
];

const gridChallenges = {
  medium: {
    size: 3,
    items: ["●", "●", "■", "●", "●", "●", "●", "▲", "●"],
    anomalies: new Set([2, 7]),
    title: "Encuentra 2 anomalías",
    description: "Dos elementos rompen el patrón de la cuadrícula 3 × 3."
  },
  hard: {
    size: 5,
    items: Array.from({ length: 25 }, (_, index) => index === 6 ? "◆" : index === 18 ? "■" : "▲"),
    anomalies: new Set([6, 18]),
    title: "Encuentra 2 anomalías en movimiento",
    description: "Las figuras giran y cambian de orientación. Concéntrate en su forma."
  }
} as const;

function EasyDetectiveGame({ finish }: { finish: (result: GameResult) => void }) {
  const [level, setLevel] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const started = useRef(Date.now()).current;
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const choose = (index: number) => {
    if (feedback) return;
    const hit = index === easyLevels[level].odd;
    const next = correct + (hit ? 1 : 0);
    setSelected(index);
    setFeedback(hit ? "correct" : "wrong");
    timer.current = window.setTimeout(() => {
      if (level === easyLevels.length - 1) {
        const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        finish({ score: clampScore(next * 300 + Math.max(0, 100 - seconds * 4)), title: next === 3 ? "Patrones detectados" : "Sigue observando", metrics: [["Respuestas correctas", `${next}/3`], ["Tiempo", `${seconds}s`], ["Dificultad", "Fácil"]], explanation: "El escáner comparó forma, tamaño y relleno para encontrar el elemento distinto." });
      } else {
        setCorrect(next);
        setLevel(value => value + 1);
        setSelected(null);
        setFeedback(null);
      }
    }, 750);
  };

  return <section className={`play-panel detective-simulation ${feedback ? `feedback-${feedback}` : ""}`}>
    <div className="detective-header"><div><small>ANÁLISIS DE ANOMALÍAS · FÁCIL</small><h2>Nivel {level + 1} de 3</h2></div><div className="detective-progress">{easyLevels.map((_, index) => <span className={index < level ? "complete" : index === level ? "active" : ""} key={index} />)}</div></div>
    <p>El escáner está comparando forma, tamaño y relleno. Selecciona la anomalía.</p>
    <div className="scanner-area"><div className="scanner-beam" aria-hidden="true" /><div className="pattern-grid pattern-grid-easy">{easyLevels[level].items.map((value, index) => <button type="button" disabled={feedback !== null} className={selected === index ? feedback ?? "" : ""} key={index} onClick={() => choose(index)} aria-label={`Elemento ${index + 1}`}><span className="pattern-symbol">{value}</span><small>#{index + 1}</small></button>)}</div></div>
    {feedback && <div className="analysis-feedback" aria-live="polite"><strong>{feedback === "correct" ? "✓ Patrón detectado" : "↗ Era otro elemento"}</strong><span>{easyLevels[level].clue}</span></div>}
  </section>;
}

function GridDetectiveGame({ difficulty, finish }: { difficulty: "medium" | "hard"; finish: (result: GameResult) => void }) {
  const challenge = gridChallenges[difficulty];
  const [selected, setSelected] = useState(new Set<number>());
  const [mistakes, setMistakes] = useState(new Set<number>());
  const [completed, setCompleted] = useState(false);
  const started = useRef(Date.now()).current;
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const choose = (index: number) => {
    if (completed || selected.has(index) || mistakes.has(index)) return;
    if (!challenge.anomalies.has(index)) {
      setMistakes(current => new Set(current).add(index));
      return;
    }
    const next = new Set(selected).add(index);
    setSelected(next);
    if (next.size !== challenge.anomalies.size) return;
    setCompleted(true);
    const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
    const difficultyBonus = difficulty === "hard" ? 180 : 100;
    const score = clampScore(900 + difficultyBonus - mistakes.size * 110 - seconds * 3);
    timer.current = window.setTimeout(() => finish({ score, title: mistakes.size === 0 ? "Anomalías detectadas" : "Análisis completado", metrics: [["Anomalías encontradas", `${next.size}/${challenge.anomalies.size}`], ["Intentos incorrectos", mistakes.size], ["Tiempo", `${seconds}s`], ["Dificultad", difficulty === "hard" ? "Difícil" : "Medio"]], explanation: `Analizaste ${challenge.items.length} elementos y separaste las figuras que no compartían el patrón dominante.` }), 700);
  };

  return <section className={`play-panel detective-simulation detective-${difficulty} ${completed ? "feedback-correct" : ""}`}>
    <div className="detective-header"><div><small>ANÁLISIS DE ANOMALÍAS · {difficulty === "hard" ? "DIFÍCIL" : "MEDIO"}</small><h2>{challenge.title}</h2></div><strong className="anomaly-counter">{selected.size}/{challenge.anomalies.size}</strong></div>
    <p>{challenge.description}</p>
    <div className="scanner-area"><div className="scanner-beam" aria-hidden="true" /><div className={`pattern-grid pattern-grid-${challenge.size}`}>{challenge.items.map((value, index) => <button type="button" disabled={completed} aria-pressed={selected.has(index)} className={selected.has(index) ? "correct" : mistakes.has(index) ? "wrong" : ""} key={`${index}-${value}`} onClick={() => choose(index)} aria-label={`Elemento ${index + 1}`}><span className="pattern-symbol" style={{ animationDelay: `${(index % 7) * -0.18}s` }}>{value}</span><small>#{index + 1}</small></button>)}</div></div>
    <div className="analysis-feedback" aria-live="polite"><strong>{completed ? "✓ Análisis completo" : mistakes.size ? "Sigue buscando" : "Selecciona las figuras distintas"}</strong><span>{completed ? "Encontraste todas las anomalías." : `${challenge.anomalies.size - selected.size} pendientes`}</span></div>
  </section>;
}

export function DetectiveGame({ difficulty, finish }: { difficulty: EducationalDifficulty; finish: (result: GameResult) => void }) {
  if (difficulty === "easy") return <EasyDetectiveGame finish={finish} />;
  return <GridDetectiveGame difficulty={difficulty} finish={finish} />;
}
