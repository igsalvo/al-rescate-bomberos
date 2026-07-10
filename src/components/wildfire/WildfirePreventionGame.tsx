import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
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
    {image ? <image href={image} x="0" y="0" width="1" height="1" preserveAspectRatio="none" /> : <><rect width="1" height="1" fill="#d9ead1" /><path d="M0 0.58 C0.22 0.48 0.42 0.7 0.63 0.58 S0.88 0.42 1 0.52" fill="none" stroke="#8c9f72" strokeWidth=".025" /></>}
    <rect x={rect.x1} y={rect.y1} width={rect.x2 - rect.x1} height={rect.y2 - rect.y1} fill="rgba(255,255,255,.08)" stroke="#f7c948" strokeWidth=".004" />
    {scenario.grid.map((cell) => {
      const key = cellKey(cell.row, cell.column);
      const box = rectForCell(scenario.calibration, cell.row, cell.column);
      const hiddenFocus = mode === "team" && !activeFrame;
      const fill = burning.has(key) ? "#f05232" : burned.has(key) ? "#55291f" : blocked.has(key) || breaks.has(key) ? "#2b1d14" : terrainColors[cell.terrain];
      return <rect key={key} x={box.x} y={box.y} width={box.width} height={box.height} fill={fill} fillOpacity={burning.has(key) || burned.has(key) || blocked.has(key) || breaks.has(key) ? 0.82 : 0.24} stroke="white" strokeOpacity={scenario.gridOpacity} strokeWidth=".0016" className="wildfire-cell">
        <title>{cell.coordinate}{!hiddenFocus && cell.ignitionEligible ? " · posible foco" : ""}{tool === "multi" ? " · alternar cortafuego permitido" : ""}</title>
      </rect>;
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

function AdminMode({ scenario, setScenario, result, setResult }: { scenario: ScenarioConfig | LockedScenario; setScenario: (scenario: ScenarioConfig | LockedScenario) => void; result: SimulationResult | null; setResult: (result: SimulationResult | null) => void }) {
  const [tool, setTool] = useState<AdminTool>("combustible");
  const locked = isLockedScenario(scenario);
  const [frame, setFrame] = useState(0);
  const activeFrame = result?.frames[frame];

  const persist = (next: ScenarioConfig | LockedScenario) => {
    setScenario(next);
    saveScenario(next);
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

function TeamMode({ scenario, result, setResult }: { scenario: ScenarioConfig | LockedScenario; result: SimulationResult | null; setResult: (result: SimulationResult | null) => void }) {
  const [strategy, setStrategy] = useState(loadStrategy);
  const [frame, setFrame] = useState(0);
  const locked = isLockedScenario(scenario);
  const activeFrame = result?.frames[frame];
  const firebreaks = useMemo(() => new Set(strategy.firebreaks), [strategy.firebreaks]);
  useEffect(() => saveStrategy(strategy), [strategy]);
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
  };
  return <div className="wildfire-layout">
    <aside className="wildfire-panel">
      <h2>Equipo</h2>
      {!locked && <p className="wildfire-alert">El escenario aún no ha sido bloqueado por administración.</p>}
      <dl className="wildfire-stats"><div><dt>Viento inicial</dt><dd>{scenario.wind}</dd></div><div><dt>Cortafuegos</dt><dd>{strategy.firebreaks.length}/{scenario.firebreakBudget}</dd></div></dl>
      <label>Justificación estratégica<textarea disabled={strategy.locked || !locked} value={strategy.justification} onChange={(event) => setStrategy((current) => ({ ...current, justification: event.target.value }))} /></label>
      <div className="action-row"><button className="primary" type="button" disabled={!locked || strategy.locked || strategy.firebreaks.length === 0 || strategy.justification.trim().length < 8} onClick={simulate}>Confirmar estrategia</button><button className="secondary" type="button" disabled={strategy.locked} onClick={() => setStrategy({ firebreaks: [], justification: "", locked: false })}>Limpiar</button></div>
      {result && <><label>Ronda {frame}/{result.frames.length - 1}<input type="range" min="0" max={result.frames.length - 1} value={frame} onChange={(event) => setFrame(Number(event.target.value))} /></label><div className="wildfire-result"><strong>{result.score} pts</strong><span>{result.contained ? "Incendio contenido" : "Incendio activo al cierre"}</span><small>{result.burnedCells} celdas afectadas · valor protegido {result.protectedValue}/{result.totalValue}</small></div></>}
    </aside>
    <section className="wildfire-board"><GridOverlay scenario={scenario} mode="team" activeFrame={activeFrame} teamBreaks={firebreaks} onCell={toggleBreak} /></section>
  </div>;
}

export function WildfirePreventionGame({ onHome }: { onHome: () => void }) {
  const [mode, setMode] = useState<"admin" | "team">("admin");
  const [scenario, setScenario] = useState<ScenarioConfig | LockedScenario>(() => loadScenario());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const reset = () => {
    resetScenarioStorage();
    const next = createDefaultScenario();
    setScenario(next);
    setResult(null);
  };

  return <main className="wildfire-game">
    <header className="wildfire-header">
      <div><p className="eyebrow">Simulación · Prevención de incendios</p><h1>Detén el incendio forestal</h1><p>Configura una grilla 20 x 20 sobre el mapa, bloquea el escenario y evalúa estrategias de cortafuegos por rondas.</p></div>
      <nav><button className={mode === "admin" ? "primary" : "secondary"} type="button" onClick={() => setMode("admin")}>Administrador</button><button className={mode === "team" ? "primary" : "secondary"} type="button" onClick={() => setMode("team")}>Equipo</button><button className="secondary" type="button" onClick={reset}><RotateCcw size={18} /> Reiniciar</button><button className="secondary" type="button" onClick={onHome}><Save size={18} /> Catálogo</button></nav>
    </header>
    {mode === "admin" ? <AdminMode scenario={scenario} setScenario={setScenario} result={result} setResult={setResult} /> : <TeamMode scenario={scenario} result={result} setResult={setResult} />}
    <footer className="wildfire-legend">{Object.entries(terrainLabels).map(([terrain, label]) => <span key={terrain}><i style={{ background: terrainColors[terrain as GridCell["terrain"]] }} />{label}</span>)}<span><i className="break" />Cortafuego</span><span><i className="fire" />Fuego</span></footer>
  </main>;
}
