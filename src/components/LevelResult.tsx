import { Home, RotateCcw, Star, Trophy } from "lucide-react";
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
        <h2>{result.grade}</h2>
        <div className="stars" aria-label={`${result.stars} estrellas`}>
          {[1, 2, 3].map((star) => (
            <Star key={star} className={star <= result.stars ? "filled" : ""} aria-hidden="true" />
          ))}
        </div>
        <div className="result-grid">
          <span>Tiempo de preparación</span>
          <strong>{result.preparationTime}s</strong>
          <span>Tiempo de viaje</span>
          <strong>{result.travelTime}s</strong>
          <span>Tiempo total de respuesta</span>
          <strong>{result.playerTime}s</strong>
          <span>Mejor tiempo</span>
          <strong>{result.optimalTime}s</strong>
          <span>Decisión</span>
          <strong>{result.decisionTime}s</strong>
          <span>Compañía</span>
          <strong>{result.companyName}</strong>
          <span>Carro</span>
          <strong>{result.truckName}</strong>
          <span>Ruta</span>
          <strong>{result.routeName}</strong>
          <span>Mejor combinación</span>
          <strong>{result.bestCombination}</strong>
        </div>
        <p className="explanation">{result.explanation}</p>
        {result.tripEvent ? <p className="event-summary"><strong>{result.tripEvent.onomatopoeia}</strong> {result.tripEvent.label}: {result.tripEvent.description}</p> : null}
        <div className="mini-list">
          {result.obstacles.length ? result.obstacles.map((item) => <span key={item}>{OBSTACLE_LABELS[item]}</span>) : <span>Sin obstáculos importantes</span>}
        </div>
        {result.breakdown ? (
          <div className="score-breakdown">
            <h2>Desglose del puntaje</h2>
            <span>Selección adecuada del carro <strong>{result.breakdown.truck}/30</strong></span>
            <span>Calidad de la ruta <strong>{result.breakdown.route}/30</strong></span>
            <span>Rapidez de respuesta <strong>{result.breakdown.speed}/20</strong></span>
            <span>Seguridad del recorrido <strong>{result.breakdown.safety}/10</strong></span>
            <span>Uso eficiente de recursos <strong>{result.breakdown.resources}/10</strong></span>
          </div>
        ) : null}
        <div className="result-notes">
          <article><h2>Aciertos</h2>{result.strengths?.map((item) => <p key={item}>{item}</p>)}</article>
          <article><h2>Por mejorar</h2>{result.improvements?.map((item) => <p key={item}>{item}</p>)}</article>
        </div>
        {result.achievements?.length ? (
          <div className="achievements">
            <h2>Logros</h2>
            {result.achievements.map((item) => <span key={item}><Trophy aria-hidden="true" />{item}</span>)}
          </div>
        ) : null}
        <blockquote>{result.educationalMessage}</blockquote>
        <div className="action-row">
          <button className="primary" type="button" onClick={onNext}>
            {hasNext ? "Siguiente emergencia" : "Ver resultado final"}
          </button>
          <button className="secondary" type="button" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Intentar nuevamente
          </button>
          <button className="secondary" type="button" onClick={onHome}>
            <Home aria-hidden="true" />
            Volver a los juegos
          </button>
        </div>
      </section>
    </main>
  );
}
