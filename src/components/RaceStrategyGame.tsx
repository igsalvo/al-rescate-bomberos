import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CloudRain, Flag, Gauge, ShieldAlert, Timer, Wrench } from "lucide-react";
import { clampScore } from "../game/common";

type GameResult = { score: number; title: string; metrics: Array<[string, string | number]>; explanation: string };
type RaceEvent = { icon: string; title: string; detail: string; type: "clear" | "forecast" | "rain" | "safety" | "rival" | "danger" | "sprint"; wear: number; penalty: number };

const totalLaps = 10;
const events: RaceEvent[] = [
  { icon: "🟢", title: "Largada limpia", detail: "Pista seca y ritmo estable.", type: "clear", wear: 9, penalty: 0 },
  { icon: "⚔️", title: "Ataque del rival", detail: "Un auto se acerca por detrás.", type: "clear", wear: 10, penalty: 0.6 },
  { icon: "☁️", title: "Nubes en el sector 2", detail: "Hay 60% de probabilidad de lluvia.", type: "forecast", wear: 10, penalty: 0.4 },
  { icon: "🌧️", title: "Comienza a llover", detail: "La adherencia cae y aumenta el desgaste.", type: "rain", wear: 14, penalty: 2.8 },
  { icon: "🚨", title: "Safety Car", detail: "El pelotón se agrupa: parar cuesta menos tiempo.", type: "safety", wear: 6, penalty: -5 },
  { icon: "🔧", title: "El rival entra a boxes", detail: "Una parada ahora puede cubrir su estrategia.", type: "rival", wear: 12, penalty: 0 },
  { icon: "🌤️", title: "La pista comienza a secarse", detail: "El ritmo mejora, pero tus neumáticos sufren.", type: "forecast", wear: 13, penalty: 0.8 },
  { icon: "⚠️", title: "Neumáticos críticos", detail: "Pierdes tiempo en cada curva rápida.", type: "danger", wear: 16, penalty: 3.5 },
  { icon: "🔥", title: "Ataque final", detail: "Los rivales aumentan el ritmo.", type: "sprint", wear: 15, penalty: 1.7 },
  { icon: "🏁", title: "Última vuelta", detail: "Cada décima cuenta hasta la meta.", type: "sprint", wear: 16, penalty: 1.2 }
];

function pointOnTrack(progress: number) {
  const angle = progress * Math.PI * 2;
  return { x: 360 + Math.cos(angle) * 250, y: 180 + Math.sin(angle) * 110, rotation: angle * 180 / Math.PI + 90 };
}

function Car({ progress, color, label, compact = false }: { progress: number; color: string; label: string; compact?: boolean }) {
  const point = pointOnTrack(progress);
  const scale = compact ? .72 : 1;
  return <g className="f1-car" transform={`translate(${point.x} ${point.y}) rotate(${point.rotation}) scale(${scale})`} aria-label={label}>
    <rect x="-17" y="-9" width="34" height="18" rx="6" fill={color} />
    <path d="M-25 -5 H-14 V5 H-25 Z M14 -5 H25 V5 H14 Z" fill="#111821" />
    <rect x="-8" y="-13" width="16" height="26" rx="7" fill={color} />
    <circle cx="0" cy="0" r="5" fill="#17222d" />
    <path d="M-5 -16 H5 L8 -10 H-8 Z" fill="#edf5f8" opacity=".9" />
  </g>;
}

export function RaceStrategyGame({ finish }: { finish: (result: GameResult) => void }) {
  const [lap, setLap] = useState(1);
  const [wear, setWear] = useState(8);
  const [pitLap, setPitLap] = useState<number | null>(null);
  const [position, setPosition] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);
  const [carProgress, setCarProgress] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [pitActive, setPitActive] = useState(false);
  const animationFrame = useRef<number | null>(null);
  const event = events[lap - 1];
  const tireStatus = wear < 40 ? "Óptimos" : wear < 70 ? "Desgastados" : "Críticos";
  const tireClass = wear < 40 ? "good" : wear < 70 ? "medium" : "critical";
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => () => { if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current); }, []);

  const finishRace = (chosenPit: number | null, finalTime: number, finalPosition: number) => {
    const bestLap = 5;
    const decisionGap = Math.abs((chosenPit ?? 10) - bestLap);
    const noStopPenalty = chosenPit === null ? 210 : 0;
    const score = clampScore(1000 - decisionGap * 95 - noStopPenalty - Math.max(0, finalPosition - 2) * 25);
    finish({
      score,
      title: decisionGap <= 1 ? "Estrategia de podio" : "Había una ventana más eficiente",
      metrics: [["Posición final", `${finalPosition}.ª`], ["Tiempo total", `${finalTime.toFixed(1)}s`], ["Entrada a boxes", chosenPit ? `Vuelta ${chosenPit}` : "Sin parada"], ["Mejor ventana", "Vueltas 5–6"]],
      explanation: "El Safety Car de la vuelta 5 reducía el costo de entrar a boxes. La estrategia equilibró tiempo de parada, clima y pérdida de ritmo por desgaste."
    });
  };

  const completeLap = (stop: boolean) => {
    const chosenPit = stop && pitLap === null ? lap : pitLap;
    const nextWear = stop ? 12 : Math.min(100, wear + event.wear);
    const wearPenalty = Math.max(0, wear - 48) * .075;
    const pitPenalty = stop ? (event.type === "safety" ? 11.5 : 19.5) : 0;
    const lapTime = Math.max(51, 58.4 + event.penalty + wearPenalty + pitPenalty);
    const nextTime = raceTime + lapTime;
    let nextPosition = position;
    if (stop) nextPosition = Math.min(8, position + (event.type === "safety" ? 1 : 2));
    else if (event.type === "rival") nextPosition = Math.max(1, position - 1);
    else if (wear > 72) nextPosition = Math.min(8, position + 1);
    else if (chosenPit && wear < 42 && lap >= chosenPit + 1) nextPosition = Math.max(1, position - 1);
    setWear(nextWear);
    setRaceTime(nextTime);
    setLastDelta(lapTime - 58.4);
    setPosition(nextPosition);
    setPitActive(false);
    setAnimating(false);
    if (lap === totalLaps) finishRace(chosenPit, nextTime, nextPosition);
    else setLap(current => current + 1);
  };

  const runLap = (stop: boolean) => {
    if (animating) return;
    if (stop && pitLap === null) setPitLap(lap);
    setPitActive(stop);
    setAnimating(true);
    const duration = reducedMotion ? 180 : stop ? 2200 : event.type === "safety" ? 2400 : 1700;
    const started = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCarProgress(eased);
      if (progress < 1) animationFrame.current = requestAnimationFrame(animate);
      else { setCarProgress(0); completeLap(stop); }
    };
    animationFrame.current = requestAnimationFrame(animate);
  };

  return <section className={`f1-experience weather-${event.type} ${animating ? "is-racing" : ""}`}>
    <div className="f1-hud">
      <div><span>Vuelta</span><strong>{lap}<small> / {totalLaps}</small></strong></div>
      <div><span>Posición</span><strong>P{position}</strong></div>
      <div><span>Tiempo</span><strong>{raceTime ? raceTime.toFixed(1) : "0.0"}<small>s</small></strong></div>
      <div className={tireClass}><span>Neumáticos</span><strong>{wear}%</strong><small>{tireStatus}</small></div>
    </div>

    <div className="f1-stage">
      <svg className="f1-circuit" viewBox="0 0 720 360" role="img" aria-label={`Circuito. Auto en vuelta ${lap} de ${totalLaps}`}>
        <defs>
          <radialGradient id="grass" cx="50%" cy="40%"><stop offset="0" stopColor="#2f7459"/><stop offset="1" stopColor="#173f35"/></radialGradient>
          <filter id="carShadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".45"/></filter>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="rgba(255,255,255,.035)"/></pattern>
        </defs>
        <rect width="720" height="360" rx="22" fill="url(#grass)" />
        <rect width="720" height="360" rx="22" fill="url(#grid)" />
        <ellipse cx="360" cy="180" rx="250" ry="110" fill="none" stroke="#d9dce0" strokeWidth="72" />
        <ellipse cx="360" cy="180" rx="250" ry="110" fill="none" stroke="#2d3339" strokeWidth="61" />
        <ellipse cx="360" cy="180" rx="250" ry="110" fill="none" stroke="#d9dfe2" strokeWidth="2" strokeDasharray="14 18" opacity=".5" />
        <ellipse cx="360" cy="180" rx="282" ry="142" fill="none" stroke="#ef3340" strokeWidth="8" strokeDasharray="18 12" />
        <ellipse cx="360" cy="180" rx="218" ry="78" fill="none" stroke="#f4f4f0" strokeWidth="8" strokeDasharray="18 12" />
        <path d="M510 278 C555 315 615 315 646 262" fill="none" stroke="#14191e" strokeWidth="25" />
        <path d="M510 278 C555 315 615 315 646 262" fill="none" stroke="#e7eced" strokeWidth="2" strokeDasharray="10 8" />
        <g className="start-line"><path d="M606 169V213" stroke="white" strokeWidth="6" strokeDasharray="5 5"/><text x="576" y="238" fill="white" fontSize="11" fontWeight="800">META</text></g>
        <g className="grandstand"><path d="M220 38H500" stroke="#9fc7c1" strokeWidth="13" strokeDasharray="4 7"/><text x="360" y="31" textAnchor="middle" fill="#d8ece7" fontSize="11">TRIBUNA</text></g>
        <g filter="url(#carShadow)"><Car progress={carProgress} color="#e63238" label="Tu auto"/><Car progress={(carProgress + .36) % 1} color="#4aa6df" label="Auto rival" compact /></g>
        {event.type === "safety" && <g className="safety-car"><Car progress={(carProgress + .16) % 1} color="#f5c842" label="Safety Car" compact/><text x="350" y="180" textAnchor="middle" fill="#f7db67" fontSize="20" fontWeight="900">SAFETY CAR</text></g>}
        {(event.type === "rain" || event.type === "danger") && <g className="track-rain" aria-hidden="true">{Array.from({length:24},(_,index)=><line key={index} x1={(index*47)%720} y1={(index*83)%350} x2={(index*47)%720-9} y2={(index*83)%350+18}/>)}</g>}
      </svg>
      {animating && <div className={`race-live-event ${event.type}`}><span>{event.icon}</span><div><small>EN PISTA</small><strong>{pitActive ? "Entrada a boxes" : event.title}</strong><p>{pitActive ? "El equipo cambia los cuatro neumáticos…" : event.detail}</p></div></div>}
      {pitActive && <div className="pit-animation"><div className="pit-car">🏎️</div><span>🔧</span><span>🛞</span><span>🛞</span><b>PIT STOP</b></div>}
    </div>

    <div className="f1-console">
      <div className="race-event-panel" key={lap}>
        <span className="event-symbol">{event.icon}</span>
        <div><small>RADIO · VUELTA {lap}</small><h2>{event.title}</h2><p>{event.detail}</p></div>
      </div>
      <div className="strategy-panel">
        <div className="strategy-title"><div><Gauge size={19}/><span>Estado de carrera</span></div><b className={lastDelta > 2 ? "losing" : "gaining"}>{lastDelta ? `${lastDelta > 0 ? "+" : ""}${lastDelta.toFixed(1)}s última vuelta` : "Sin referencia"}</b></div>
        <div className="tire-visual"><div className={tireClass} style={{"--wear": `${wear}%`} as CSSProperties}><span /></div><div><strong>{tireStatus}</strong><small>{pitLap ? `Parada realizada: vuelta ${pitLap}` : "Parada pendiente"}</small></div></div>
        <div className="strategy-actions">
          <button type="button" className="pit-button" disabled={animating || pitLap !== null} onClick={() => runLap(true)}><Wrench aria-hidden="true"/><span><strong>Entrar a boxes</strong><small>Neumáticos nuevos · pierdes tiempo</small></span></button>
          <button type="button" className="continue-button" disabled={animating} onClick={() => runLap(false)}><Flag aria-hidden="true"/><span><strong>{lap === totalLaps ? "Ir a la meta" : "Continuar una vuelta"}</strong><small>Mantienes posición · aumenta desgaste</small></span></button>
        </div>
      </div>
    </div>

    <div className="race-timeline" aria-label="Cronología de carrera">
      {events.map((item,index)=><div key={item.title} className={`${index + 1 < lap ? "complete" : ""} ${index + 1 === lap ? "current" : ""}`}><span>{index+1}</span><small>{item.icon}</small></div>)}
    </div>
    <div className="f1-legend"><span><CloudRain size={15}/> clima</span><span><ShieldAlert size={15}/> eventos</span><span><Timer size={15}/> tiempo en vivo</span></div>
  </section>;
}
