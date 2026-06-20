import { Home, RotateCcw, Star } from "lucide-react";
import { scoreToStars } from "../game/common";

export function CommonResult({ score, title, metrics, explanation, learning, onAgain, onHome }: { score: number; title: string; metrics: Array<[string, string | number]>; explanation: string; learning: string; onAgain: () => void; onHome: () => void }) {
  const stars = scoreToStars(score);
  return <section className="common-result" aria-live="polite"><p className="eyebrow">Resultado</p><h2>{title}</h2><div className="score-line"><strong>{score}</strong><span>/ 1.000 puntos</span></div>
    <div className="stars" aria-label={`${stars} estrellas`}>{[1,2,3].map(star => <Star key={star} className={star <= stars ? "filled" : ""} aria-hidden="true" />)}</div>
    <dl>{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="result-explanation">{explanation}</p><blockquote>{learning}</blockquote>
    <div className="action-row"><button className="primary" onClick={onAgain} type="button"><RotateCcw />Jugar de nuevo</button><button className="secondary" onClick={onHome} type="button"><Home />Elegir otro juego</button></div>
  </section>;
}
