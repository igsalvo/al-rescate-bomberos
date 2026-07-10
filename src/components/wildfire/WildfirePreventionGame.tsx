import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, RotateCcw, Save, ShieldCheck, Users, User } from "lucide-react";
import { createDefaultScenario, terrainColors, terrainLabels } from "../../wildfire/config";
import { chooseIgnitions, cellKey, runWildfireSimulation } from "../../wildfire/simulation";
import { loadScenario, loadStrategy, resetScenarioStorage, saveScenario, saveStrategy } from "../../wildfire/storage";
import { GRID_ROWS, GRID_SIZE, type AdminTool, type GridCell, type LockedScenario, type NormalizedRect, type ScenarioConfig, type SimulationResult, type TeamStrategy, type WindDirection } from "../../wildfire/types";

const tools: Array<{ id: AdminTool; label: string }> = [
  { id: "combustible", label: "Combustible" },
  { id: "road", label: "Camino" },
  { id: "water", label: "Agua" },
  { id: "rock", label: "Roca" },
  { id: "city", label: "Ciudad" },
  { id: "infrastructure", label: "Infraestructura" },
  { id: "ignition", label: "Posible foco" },
  { id: "erase", label: "Borrar" },
  { id: "multi", label: "Selección" },
  { id: "rectangle", label: "Rectángulo" }
];

const windOptions: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const terrainMarks: Record<GridCell["terrain"], string> = {
  combustible: "T",
  road: "=",
  water: "~",
  rock: "R",
  city: "C",
  infrastructure: "I"
};

type WildfirePart = {
  id: "part-1" | "part-2";
  title: string;
  label: string;
  description: string;
  defaultScenario: ScenarioConfig;
};

const partOneMap = "https://res.cloudinary.com/drtluusdh/image/upload/v1783695644/Mapa_pequen%CC%83o_1_l7szxl.png";

const wildfireParts: WildfirePart[] = [
  {
    id: "part-1",
    title: "Parte 1",
    label: "Individual",
    description: "Mapa pequeño con 3 cortafuegos disponibles y 1 foco de incendio.",
    defaultScenario: createDefaultScenario({
      mapImage: partOneMap,
      focusCount: 1,
      firebreakBudget: 3
    })
  },
  {
    id: "part-2",
    title: "Parte 2",
    label: "Grupal",
    description: "Escenario grupal con la misma configuración que el simulador actual.",
    defaultScenario: createDefaultScenario()
  }
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeRect(rect: NormalizedRect): NormalizedRect {
  return {
    x1: Math.min(rect.x1, rect.x2),
    y1: Math.min(rect.y1, rect.y2),
    x2: Math.max(rect.x1, rect.x2),
    y2: Math.max(rect.y1, rect.y2)
  };
}

function isLockedScenario(scenario: ScenarioConfig | LockedScenario): scenario is LockedScenario {
  return Boolean((scenario as LockedScenario).ignitionCells);
}

function rectForCell(calibration: NormalizedRect, row: number, column: number) {
  const rect = normalizeRect(calibration);
  const width = (rect.x2 - rect.x1) / GRID_SIZE;
  const height = (rect.y2 - rect.y1) / GRID_SIZE;
  return { x: rect.x1 + column * width, y: rect.y1 + row * height, width, height };
}

function cellFromPoint(calibration: NormalizedRect, x: number, y: number) {
  const rect = normalizeRect(calibration);
  if (x < rect.x1 || x > rect.x2 || y < rect.y1 || y > rect.y2) return null;
  const column = Math.min(GRID_SIZE - 1, Math.floor(((x - rect.x1) / (rect.x2 - rect.x1)) * GRID_SIZE));
  const row = Math.min(GRID_SIZE - 1, Math.floor(((y - rect.y1) / (rect.y2 - rect.y1)) * GRID_SIZE));
  return { row, column, key: cellKey(row, column) };
}

function pointFromEvent(event: PointerEvent<SVGSVGElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return { x: clamp01((event.clientX - bounds.left) / bounds.width), y: clamp01((event.clientY - bounds.top) / bounds.height) };
}

function updateCell(grid: GridCell[], key: string, tool: AdminTool): GridCell[] {
  return grid.map((cell) => {
    if (cellKey(cell.row, cell.column) !== key) return cell;
    if (tool === "erase") return { ...cell, terrain: "combustible" as const, ignitionEligible: false, firebreakAllowed: true };
    if (tool === "ignition") return { ...cell, ignitionEligible: !cell.ignitionEligible };
    if (tool === "multi" || tool === "rectangle") return { ...cell, firebreakAllowed: !cell.firebreakAllowed };
    return { ...cell, terrain: tool, firebreakAllowed: tool !== "water" && tool !== "rock", ignitionEligible: tool === "combustible" ? cell.ignitionEligible : false };
  });
}

function GridOverlay({
  scenario,
  mode,
  tool,
  activeFrame,
  teamBreaks,
  onCell,
  onCalibration
}: {
  scenario: ScenarioConfig | LockedScenario;
  mode: "admin" | "team";
  tool?: AdminTool;
  activeFrame?: SimulationResult["frames"][number];
  teamBreaks?: Set<string>;
  onCell?: (key: string) => void;
  onCalibration?: (corner: "start" | "end", point: { x: number; y: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [corner, setCorner] = useState<"start" | "end" | null>(null);
  const rect = normalizeRect(scenario.calibration);
  const burning = new Set(activeFrame?.burning ?? []);
  const burned = new Set(activeFrame?.burned ?? []);
  const blocked = new Set(activeFrame?.blocked ?? []);
  const breaks = teamBreaks ?? new Set<string>();
  const image = scenario.mapImage;

  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event);
    if (corner && onCalibration) {
      onCalibration(corner, point);
      return;
    }
    const cell = cellFromPoint(scenario.calibration, point.x, point.y);
    if (cell && onCell) onCell(cell.key);
  };

  return <svg className="wildfire-map-svg" viewBox="0 0 1 1" preserveAspectRatio="none" onPointerDown={(event) => { setDragging(true); handlePointer(event); }} onPointerMove={(event) => { if (dragging) handlePointer(event); }} onPointerUp={() => { setDragging(false); setCorner(null); }} onPointerLeave={() => { setDragging(false); setCorner(null); }}>
    <defs>
      <pattern id="terrain-road" width=".018" height=".018" patternUnits="userSpaceOnUse"><path d="M0 .009 H.018" stroke="rgba(80,52,18,.55)" strokeWidth=".002" /></pattern>
      <pattern id="terrain-water" width=".024" height=".016" patternUnits="userSpaceOnUse"><path d="M0 .008 C.006 .002 .012 .014 .018 .008 S.03 .008 .036 .008" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth=".002" /></pattern>
      <pattern id="terrain-rock" width=".02" height=".02" patternUnits="userSpaceOnUse"><path d="M.01 0 L.02 .01 L.01 .02 L0 .01 Z" fill="rgba(31,40,47,.28)" /></pattern>
      <pattern id="terrain-city" width=".02" height=".02" patternUnits="userSpaceOnUse"><path d="M.003 .017 V.006 H.008 V.017 M.011 .017 V.002 H.017 V.017" stroke="rgba(255,255,255,.5)" strokeWidth=".002" fill="none" /></pattern>
      <pattern id="terrain-infrastructure" width=".02" height=".02" patternUnits="userSpaceOnUse"><path d="M.002 .018 L.01 .002 L.018 .018 M.005 .011 H.015" stroke="rgba(255,255,255,.55)" strokeWidth=".002" fill="none" /></pattern>
      <filter id="fire-glow"><feDropShadow dx="0" dy="0" stdDeviation=".008" floodColor="#ff6a2a" floodOpacity=".9" /></filter>
    </defs>
    {image ? <image href={image} x="0" y="0" width="1" height="1" preserveAspectRatio="none" /> : <><rect width="1" height="1" fill="#d9ead1" /><path d="M0 0.58 C0.22 0.48 0.42 0.7 0.63 0.58 S0.88 0.42 1 0.52" fill="none" stroke="#8c9f72" strokeWidth=".025" /></>}
    <rect x={rect.x1} y={rect.y1} width={rect.x2 - rect.x1} height={rect.y2 - rect.y1} fill="rgba(255,255,255,.08)" stroke="#f7c948" strokeWidth=".004" />
    {scenario.grid.map((cell) => {
      const key = cellKey(cell.row, cell.column);
      const box = rectForCell(scenario.calibration, cell.row, cell.column);
      const hiddenFocus = mode === "team" && !activeFrame;
      const active = burning.has(key) || burned.has(key) || blocked.has(key) || breaks.has(key);
      const fill = burning.has(key) ? "#f05232" : burned.has(key) ? "#55291f" : blocked.has(key) || breaks.has(key) ? "#2b1d14" : terrainColors[cell.terrain];
      const pattern = cell.terrain === "combustible" ? "" : `url(#terrain-${cell.terrain})`;
      return <g key={key} className="wildfire-cell">
        <rect x={box.x} y={box.y} width={box.width} height={box.height} fill={fill} fillOpacity={active ? 0.9 : 0.68} stroke="white" strokeOpacity={scenario.gridOpacity} strokeWidth=".0016">
          <title>{cell.coordinate} · {terrainLabels[cell.terrain]}{!hiddenFocus && cell.ignitionEligible ? " · posible foco" : ""}{tool === "multi" ? " · alternar cortafuego permitido" : ""}</title>
        </rect>
        {pattern && <rect x={box.x} y={box.y} width={box.width} height={box.height} fill={pattern} opacity=".9" pointerEvents="none" />}
        <text x={box.x + box.width / 2} y={box.y + box.height * 0.64} textAnchor="middle" fontSize=".015" fontWeight="900" fill={cell.terrain === "road" ? "#4f3515" : "white"} opacity={active ? 0 : 0.9} pointerEvents="none">{terrainMarks[cell.terrain]}</text>
        {(blocked.has(key) || breaks.has(key)) && <text x={box.x + box.width / 2} y={box.y + box.height * 0.66} textAnchor="middle" fontSize=".018" fontWeight="900" fill="#ffffff" pointerEvents="none">X</text>}
        {burning.has(key) && <circle cx={box.x + box.width / 2} cy={box.y + box.height / 2} r={Math.min(box.width, box.height) * 0.28} fill="#ffcf33" filter="url(#fire-glow)" pointerEvents="none" />}
      </g>;
    })}
    {mode === "admin" && scenario.grid.filter((cell) => cell.ignitionEligible).map((cell) => {
      const box = rectForCell(scenario.calibration, cell.row, cell.column);
      return <circle key={cell.coordinate} cx={box.x + box.width / 2} cy={box.y + box.height / 2} r={Math.min(box.width, box.height) * 0.22} fill="#ffcf33" stroke="#7a4100" strokeWidth=".002" />;
    })}
    {isLockedScenario(scenario) && mode === "admin" && scenario.ignitionCells.map((key) => {
      const cell = scenario.grid.find((item) => cellKey(item.row, item.column) === key);
      if (!cell) return null;
      const box = rectForCell(scenario.calibration, cell.row, cell.column);
      return <text key={key} x={box.x + box.width / 2} y={box.y + box.height * 0.68} textAnchor="middle" fontSize=".025">🔥</text>;
    })}
    {onCalibration && <><circle cx={rect.x1} cy={rect.y1} r=".014" fill="#0b3a66" stroke="white" strokeWidth=".004" onPointerDown={(event) => { event.stopPropagation(); setDragging(true); setCorner("start"); }} /><circle cx={rect.x2} cy={rect.y2} r=".014" fill="#d72f35" stroke="white" strokeWidth=".004" onPointerDown={(event) => { event.stopPropagation(); setDragging(true); setCorner("end"); }} /></>}
  </svg>;
}

function AdminMode({ partId, scenario, setScenario, result, setResult }: { partId: WildfirePart["id"]; scenario: ScenarioConfig | LockedScenario; setScenario: (scenario: ScenarioConfig | LockedScenario) => void; result: SimulationResult | null; setResult: (result: SimulationResult | null) => void }) {
  const [tool, setTool] = useState<AdminTool>("combustible");
  const locked = isLockedScenario(scenario);
  const [frame, setFrame] = useState(0);
  const activeFrame = result?.frames[frame];

  const persist = (next: ScenarioConfig | LockedScenario) => {
    setScenario(next);
    saveScenario(partId, next);
  };
  const editScenario = (patch: Partial<ScenarioConfig>) => {
    if (locked) return;
    persist({ ...scenario, ...patch, locked: false });
  };
  const editCalibration = (corner: "start" | "end", point: { x: number; y: number }) => {
    if (locked) return;
    const next = corner === "start" ? { ...scenario.calibration, x1: point.x, y1: point.y } : { ...scenario.calibration, x2: point.x, y2: point.y };
    editScenario({ calibration: normalizeRect(next) });
  };
  const applyTool = (key: string) => {
    if (locked) return;
    editScenario({ grid: updateCell(scenario.grid, key, tool) });
  };
  const lockScenario = () => {
    const next: LockedScenario = { ...scenario, locked: true, ignitionCells: chooseIgnitions(scenario.grid, scenario.focusCount), lockedAt: new Date().toISOString() };
    persist(next);
  };
  const run = () => {
    if (!isLockedScenario(scenario)) return;
    const emptyStrategy: TeamStrategy = { firebreaks: [], justification: "Simulación administrativa sin cortafuegos de equipo.", locked: true };
    const next = runWildfireSimulation(scenario, emptyStrategy);
    setResult(next);
    setFrame(0);
  };

  return <div className="wildfire-layout">
    <aside className="wildfire-panel">
      <h2>Administrador</h2>
      <label>Imagen del mapa<input type="file" accept="image/*" disabled={locked} onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => editScenario({ mapImage: String(reader.result) });
        reader.readAsDataURL(file);
      }} /></label>
      <div className="wildfire-grid-controls">
        {(["x1", "y1", "x2", "y2"] as const).map((name) => <label key={name}>{name.toUpperCase()}<input type="number" min="0" max="1" step="0.001" disabled={locked} value={scenario.calibration[name]} onChange={(event) => editScenario({ calibration: normalizeRect({ ...scenario.calibration, [name]: clamp01(Number(event.target.value)) }) })} /></label>)}
      </div>
      <label>Opacidad grilla<input type="range" min="0.1" max="1" step="0.05" disabled={locked} value={scenario.gridOpacity} onChange={(event) => editScenario({ gridOpacity: Number(event.target.value) })} /></label>
      <div className="tool-grid">{tools.map((item) => <button key={item.id} type="button" disabled={locked} className={tool === item.id ? "selected" : "secondary"} onClick={() => setTool(item.id)}>{item.label}</button>)}</div>
      <div className="wildfire-grid-controls">
        <label>Focos<input type="number" min="1" max="12" disabled={locked} value={scenario.focusCount} onChange={(event) => editScenario({ focusCount: Number(event.target.value) })} /></label>
        <label>Cortafuegos<input type="number" min="1" max="80" disabled={locked} value={scenario.firebreakBudget} onChange={(event) => editScenario({ firebreakBudget: Number(event.target.value) })} /></label>
        <label>Rondas<input type="number" min="1" max="30" disabled={locked} value={scenario.rounds} onChange={(event) => editScenario({ rounds: Number(event.target.value) })} /></label>
        <label>Viento<select disabled={locked} value={scenario.wind} onChange={(event) => editScenario({ wind: event.target.value as WindDirection })}>{windOptions.map((wind) => <option key={wind}>{wind}</option>)}</select></label>
      </div>
      <div className="action-row"><button className="primary" type="button" disabled={locked} onClick={lockScenario}><ShieldCheck size={18} /> Generar y bloquear</button><button className="secondary" type="button" disabled={!locked} onClick={run}>Simular</button></div>
      {result && <label>Ronda {frame}/{result.frames.length - 1}<input type="range" min="0" max={result.frames.length - 1} value={frame} onChange={(event) => setFrame(Number(event.target.value))} /></label>}
    </aside>
    <section className="wildfire-board"><GridOverlay scenario={scenario} mode="admin" tool={tool} activeFrame={activeFrame} onCell={applyTool} onCalibration={editCalibration} /></section>
  </div>;
}

function TeamMode({ partId, scenario, result, setResult }: { partId: WildfirePart["id"]; scenario: ScenarioConfig | LockedScenario; result: SimulationResult | null; setResult: (result: SimulationResult | null) => void }) {
  const [strategy, setStrategy] = useState(() => loadStrategy(partId));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playback = useRef<number | null>(null);
  const locked = isLockedScenario(scenario);
  const activeFrame = result?.frames[frame];
  const firebreaks = useMemo(() => new Set(strategy.firebreaks), [strategy.firebreaks]);
  useEffect(() => saveStrategy(partId, strategy), [partId, strategy]);
  useEffect(() => () => { if (playback.current !== null) window.clearTimeout(playback.current); }, []);
  useEffect(() => {
    if (!playing || !result) return;
    if (frame >= result.frames.length - 1) {
      setPlaying(false);
      return;
    }
    playback.current = window.setTimeout(() => setFrame((value) => value + 1), 720);
    return () => { if (playback.current !== null) window.clearTimeout(playback.current); };
  }, [frame, playing, result]);
  const toggleBreak = (key: string) => {
    if (strategy.locked || !locked) return;
    const cell = scenario.grid.find((item) => cellKey(item.row, item.column) === key);
    if (!cell?.firebreakAllowed) return;
    setStrategy((current) => {
      const next = new Set(current.firebreaks);
      next.has(key) ? next.delete(key) : next.size < scenario.firebreakBudget && next.add(key);
      return { ...current, firebreaks: [...next] };
    });
  };
  const simulate = () => {
    if (!locked) return;
    const next = runWildfireSimulation(scenario, { ...strategy, locked: true });
    setStrategy((current) => ({ ...current, locked: true }));
    setResult(next);
    setFrame(0);
    setPlaying(true);
  };
  const canConfirm = locked && !strategy.locked && strategy.firebreaks.length === scenario.firebreakBudget && strategy.justification.trim().length >= 8;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || !canConfirm) return;
      event.preventDefault();
      simulate();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canConfirm]);
  return <div className="wildfire-layout">
    <aside className="wildfire-panel">
      <h2>Equipo</h2>
      {!locked && <p className="wildfire-alert">El escenario aún no ha sido bloqueado por administración.</p>}
      <dl className="wildfire-stats"><div><dt>Viento inicial</dt><dd>{scenario.wind}</dd></div><div><dt>Cortafuegos</dt><dd>{strategy.firebreaks.length}/{scenario.firebreakBudget}</dd></div></dl>
      {!strategy.locked && locked && <p className="wildfire-hint">{strategy.firebreaks.length === scenario.firebreakBudget ? "Presiona Enter para confirmar y reproducir las rondas." : `Faltan ${scenario.firebreakBudget - strategy.firebreaks.length} cortafuegos para habilitar Enter.`}</p>}
      <label>Justificación estratégica<textarea disabled={strategy.locked || !locked} value={strategy.justification} onChange={(event) => setStrategy((current) => ({ ...current, justification: event.target.value }))} /></label>
      <div className="action-row"><button className="primary" type="button" disabled={!canConfirm} onClick={simulate}>Confirmar con Enter</button><button className="secondary" type="button" disabled={strategy.locked} onClick={() => setStrategy({ firebreaks: [], justification: "", locked: false })}>Limpiar</button></div>
      {result && <><label>Ronda {frame}/{result.frames.length - 1}<input type="range" min="0" max={result.frames.length - 1} disabled={playing} value={frame} onChange={(event) => setFrame(Number(event.target.value))} /></label><div className="wildfire-playback"><div style={{ width: `${Math.round(frame / Math.max(1, result.frames.length - 1) * 100)}%` }} /></div><div className="wildfire-result"><strong>{playing ? `Ronda ${frame}` : `${result.score} pts`}</strong><span>{playing ? "Simulación en curso" : result.contained ? "Incendio contenido" : "Incendio activo al cierre"}</span><small>{result.burnedCells} celdas afectadas · valor protegido {result.protectedValue}/{result.totalValue}</small></div></>}
    </aside>
    <section className="wildfire-board"><GridOverlay scenario={scenario} mode="team" activeFrame={activeFrame} teamBreaks={firebreaks} onCell={toggleBreak} /></section>
  </div>;
}

function WildfirePartSelector({ onChoose }: { onChoose: (part: WildfirePart) => void }) {
  return <main className="wildfire-game">
    <section className="wildfire-part-select">
      <div>
        <p className="eyebrow">Simulación · Prevención de incendios</p>
        <h1>Detén el incendio forestal</h1>
        <p>Elige la etapa de la actividad para cargar el mapa, la cantidad de cortafuegos y los focos iniciales correspondientes.</p>
      </div>
      <div className="wildfire-part-grid">
        {wildfireParts.map((part) => (
          <button type="button" className="wildfire-part-card" onClick={() => onChoose(part)} key={part.id}>
            <span>{part.id === "part-1" ? <User size={28} aria-hidden="true" /> : <Users size={28} aria-hidden="true" />}</span>
            <strong>{part.title}</strong>
            <small>{part.label}</small>
            <p>{part.description}</p>
          </button>
        ))}
      </div>
    </section>
  </main>;
}

function WildfirePartExperience({ part, onHome, onBack }: { part: WildfirePart; onHome: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<"admin" | "team">("admin");
  const [scenario, setScenario] = useState<ScenarioConfig | LockedScenario>(() => loadScenario(part.id, part.defaultScenario));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const reset = () => {
    resetScenarioStorage(part.id);
    const next = part.defaultScenario;
    setScenario(next);
    setResult(null);
    setResetVersion((value) => value + 1);
  };

  return <main className="wildfire-game">
    <header className="wildfire-header">
      <div><p className="eyebrow">Simulación · Prevención de incendios · {part.label}</p><h1>{part.title}: Detén el incendio forestal</h1><p>Configura una grilla 20 x 20 sobre el mapa, bloquea el escenario y evalúa estrategias de cortafuegos por rondas.</p></div>
      <nav><button className="secondary" type="button" onClick={onBack}><ArrowLeft size={18} /> Partes</button><button className={mode === "admin" ? "primary" : "secondary"} type="button" onClick={() => setMode("admin")}>Administrador</button><button className={mode === "team" ? "primary" : "secondary"} type="button" onClick={() => setMode("team")}>Equipo</button><button className="secondary" type="button" onClick={reset}><RotateCcw size={18} /> Reiniciar</button><button className="secondary" type="button" onClick={onHome}><Save size={18} /> Catálogo</button></nav>
    </header>
    {mode === "admin" ? <AdminMode key={`admin-${resetVersion}`} partId={part.id} scenario={scenario} setScenario={setScenario} result={result} setResult={setResult} /> : <TeamMode key={`team-${resetVersion}`} partId={part.id} scenario={scenario} result={result} setResult={setResult} />}
    <footer className="wildfire-legend">{Object.entries(terrainLabels).map(([terrain, label]) => <span key={terrain}><i style={{ background: terrainColors[terrain as GridCell["terrain"]] }} />{label}</span>)}<span><i className="break" />Cortafuego</span><span><i className="fire" />Fuego</span></footer>
  </main>;
}

export function WildfirePreventionGame({ onHome }: { onHome: () => void }) {
  const [selectedPart, setSelectedPart] = useState<WildfirePart | null>(null);
  if (!selectedPart) return <WildfirePartSelector onChoose={setSelectedPart} />;
  return <WildfirePartExperience key={selectedPart.id} part={selectedPart} onHome={onHome} onBack={() => setSelectedPart(null)} />;
}
