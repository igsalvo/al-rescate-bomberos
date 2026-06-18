import QRCode from "react-qr-code";
import { Home, RotateCcw, Star } from "lucide-react";
import { EDUCATIONAL_MESSAGE, PROJECT_URL, REAL_PROJECT_TEXT } from "../config/content";
import type { LevelResultData } from "../game/types";

export function FinalResult({
  results,
  totals,
  onRestart,
  onHome
}: {
  results: LevelResultData[];
  totals: { score: number; stars: number; playerTime: number; optimalTime: number };
  onRestart: () => void;
  onHome: () => void;
}) {
  return (
    <main className="screen final-screen">
      <section className="panel final-panel">
        <p className="eyebrow">Resultado final</p>
        <h1>{totals.score} puntos</h1>
        <div className="stars" aria-label={`${totals.stars} estrellas acumuladas`}>
          {Array.from({ length: Math.max(3, results.length * 3) }, (_, index) => (
            <Star key={index} className={index < totals.stars ? "filled" : ""} aria-hidden="true" />
          ))}
        </div>
        <div className="result-grid">
          <span>Tiempo total</span>
          <strong>{totals.playerTime}s</strong>
          <span>Mejor solucion</span>
          <strong>{totals.optimalTime}s</strong>
        </div>
        <div className="level-summary">
          {results.map((result) => (
            <article key={result.levelId}>
              <strong>{result.levelTitle}</strong>
              <span>{result.score} pts · {result.playerTime}s</span>
            </article>
          ))}
        </div>
        <blockquote>{EDUCATIONAL_MESSAGE}</blockquote>
        <section className="real-project">
          <h2>Un proyecto real</h2>
          <p>{REAL_PROJECT_TEXT}</p>
        </section>
        <div className="qr-row">
          <div className="qr-box">
            <QRCode value={PROJECT_URL} size={118} />
          </div>
          <a className="primary link-button" href={PROJECT_URL} target="_blank" rel="noreferrer">
            Conoce el proyecto
          </a>
        </div>
        <div className="action-row">
          <button className="primary" type="button" onClick={onRestart}>
            <RotateCcw aria-hidden="true" />
            Jugar de nuevo
          </button>
          <button className="secondary" type="button" onClick={onHome}>
            <Home aria-hidden="true" />
            Volver al inicio
          </button>
        </div>
      </section>
    </main>
  );
}
