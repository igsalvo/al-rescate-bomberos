import { Home, RotateCcw, Star } from "lucide-react";
import { OBSTACLE_LABELS } from "../config/content";
import type { LevelResultData } from "../game/types";

export function LevelResult({
  result,
  hasNext,
  onNext,
  onRetry,
  onHome
}: {
  result: LevelResultData;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <main className="screen result-screen">
      <section className="panel result-panel">
        <p className="eyebrow">{result.levelTitle}</p>
        <h1>{result.score} puntos</h1>
        <div className="stars" aria-label={`${result.stars} estrellas`}>
          {[1, 2, 3].map((star) => (
            <Star key={star} className={star <= result.stars ? "filled" : ""} aria-hidden="true" />
          ))}
        </div>
        <div className="result-grid">
          <span>Tu tiempo</span>
          <strong>{result.playerTime}s</strong>
          <span>Mejor tiempo</span>
          <strong>{result.optimalTime}s</strong>
          <span>Diferencia</span>
          <strong>{Math.max(0, Math.round((result.playerTime - result.optimalTime) * 10) / 10)}s</strong>
          <span>Decisión</span>
          <strong>{result.decisionTime}s</strong>
          <span>Compañía</span>
          <strong>{result.companyName}</strong>
          <span>Carro</span>
          <strong>{result.truckName}</strong>
        </div>
        <p className="explanation">{result.explanation}</p>
        <div className="mini-list">
          {result.obstacles.length ? result.obstacles.map((item) => <span key={item}>{OBSTACLE_LABELS[item]}</span>) : <span>Sin obstáculos importantes</span>}
        </div>
        <div className="action-row">
          <button className="primary" type="button" onClick={onNext}>
            {hasNext ? "Siguiente nivel" : "Ver resultado final"}
          </button>
          <button className="secondary" type="button" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Intentar de nuevo
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
