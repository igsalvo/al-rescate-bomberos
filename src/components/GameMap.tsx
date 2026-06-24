import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, CloudRain, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { OBSTACLE_LABELS } from "../config/content";
import { cityEdges, cityNodes } from "../game/graph";
import { stations, trucks } from "../game/levels";
import { collectObstacles, edgeIdsToNodePath, findEdgeBetween, isValidMove, pathCost } from "../game/pathfinding";
import type { FireTruck as FireTruckType, LevelConfig, ObstacleType, Point, TripEvent } from "../game/types";
import { AudioControls } from "./AudioControls";
import { EmergencyMarker } from "./EmergencyMarker";
import { FireTruck } from "./FireTruck";
import { ObstacleMarker } from "./ObstacleMarker";
import { StationButton } from "./FireStation";
import { Timer } from "./Timer";

const viewBox = { width: 820, height: 620 };

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathD(nodes: string[]) {
  return nodes.map((node, index) => `${index === 0 ? "M" : "L"} ${cityNodes[node].x} ${cityNodes[node].y}`).join(" ");
}

function pathEdges(nodes: string[]) {
  const edges = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const edge = findEdgeBetween(nodes[index], nodes[index + 1]);
    if (edge) edges.push(edge);
  }
  return edges;
}

function generateTripEvent(level: LevelConfig, path: string[], truck?: FireTruckType): TripEvent | undefined {
  const obstacles = collectObstacles(path, level.weather);
  const edges = pathEdges(path);
  const hasSecondary = edges.some((edge) => edge.kind === "secondary");
  const hasNarrowIssue = truck && truck.resourceLevel >= 9 && hasSecondary;
  const candidates: TripEvent[] = [];
  if (obstacles.includes("traffic")) {
    candidates.push({ id: "traffic-clears", label: "El tráfico se despeja", description: "La congestión baja antes de que llegue el carro.", onomatopoeia: "¡Avanza!", timeModifier: -3, safetyModifier: 1 });
    candidates.push({ id: "traffic-rises", label: "El tráfico aumenta", description: "Un cruce se congestiona y obliga a reducir velocidad.", onomatopoeia: "¡Atasco!", timeModifier: 4, safetyModifier: -1, choiceRequired: level.id !== "explorador" });
  }
  if (obstacles.includes("works")) candidates.push({ id: "blocked-lane", label: "Tramo temporalmente bloqueado", description: "Los trabajos ocupan una pista y el avance es más lento.", onomatopoeia: "¡Desvío!", timeModifier: 3, safetyModifier: -1, choiceRequired: level.id !== "explorador" });
  if (hasSecondary) candidates.push({ id: "secondary-shortcut", label: "Calle secundaria disponible", description: "Un tramo alternativo permite recuperar algunos segundos.", onomatopoeia: "¡Ruta libre!", timeModifier: -2, safetyModifier: 0 });
  if (hasNarrowIssue) candidates.push({ id: "narrow-street", label: "Calle estrecha", description: "El vehículo grande debe maniobrar con más cuidado.", onomatopoeia: "¡Cuidado!", timeModifier: 3, safetyModifier: -2, choiceRequired: level.id !== "explorador" });
  if (!candidates.length || Math.random() > 0.72) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function travelTimeWithUncertainty(level: LevelConfig, path: string[], truck?: FireTruckType, event?: TripEvent) {
  const base = pathCost(path, level.weather);
  const obstacles = collectObstacles(path, level.weather);
  const trafficVariation = obstacles.includes("traffic") ? 1 + Math.floor(Math.random() * 5) : 0;
  const roadPenalty = truck ? pathEdges(path).reduce((sum, edge) => sum + (truck.roadCompatibility.includes(edge.kind) ? 0 : 1.8), 0) : 0;
  return Math.max(1, Math.round((base + trafficVariation + roadPenalty + (event?.timeModifier ?? 0)) * 10) / 10);
}

export function GameMap({
  level,
  soundEnabled,
  setSoundEnabled,
  onBeep,
  startSiren,
  stopSiren,
  reducedMotion,
  onBack,
  onRestart,
  onFinish
}: {
  level: LevelConfig;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onBeep: (name: "select" | "blocked" | "arrival" | "result" | "alarm") => void;
  startSiren: () => void;
  stopSiren: () => void;
  reducedMotion: boolean;
  onBack: () => void;
  onRestart: () => void;
  onFinish: (params: { stationId: string; truckId: string; routeName: string; path: string[]; decisionTime: number; preparationTime: number; travelTime: number; tripEvent?: TripEvent }) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const levelStartedAt = useRef(Date.now());
  const timers = useRef<number[]>([]);
  const currentEvent = useRef<TripEvent | undefined>(undefined);
  const currentTravelTime = useRef(0);
  const availableStations = stations.filter((station) => level.stationIds.includes(station.id));
  const [selectedStation, setSelectedStation] = useState(availableStations[0]?.id ?? "");
  const availableTrucks = trucks.filter((truck) => level.truckIds.includes(truck.id) && truck.stationId === selectedStation);
  const [selectedTruck, setSelectedTruck] = useState(availableTrucks[0]?.id ?? level.truckIds[0]);
  const [dragging, setDragging] = useState(false);
  const [truckPoint, setTruckPoint] = useState<Point>(availableStations[0]?.position ?? { x: 0, y: 0 });
  const [manualPath, setManualPath] = useState<string[]>([level.startNodeByStation[selectedStation]]);
  const [invalid, setInvalid] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [travelTime, setTravelTime] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [comicStage, setComicStage] = useState(-1);
  const [tripEvent, setTripEvent] = useState<TripEvent | undefined>();
  const [awaitingDecision, setAwaitingDecision] = useState(false);
  const [pendingFinish, setPendingFinish] = useState<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      timers.current.forEach(window.clearTimeout);
      stopSiren();
    };
  }, [stopSiren]);

  useEffect(() => {
    levelStartedAt.current = Date.now();
    const firstStation = availableStations[0]?.id ?? "";
    setSelectedStation(firstStation);
    setSelectedTruck(trucks.find((truck) => level.truckIds.includes(truck.id) && truck.stationId === firstStation)?.id ?? level.truckIds[0]);
    setTruckPoint(stations.find((station) => station.id === firstStation)?.position ?? { x: 0, y: 0 });
    setManualPath([level.startNodeByStation[firstStation]]);
    setInvalid("");
    setTravelTime(0);
    setSelectedRouteId("");
    setComicStage(-1);
    setTripEvent(undefined);
    currentEvent.current = undefined;
    currentTravelTime.current = 0;
    setAwaitingDecision(false);
  }, [level.id]);

  useEffect(() => {
    const station = stations.find((item) => item.id === selectedStation);
    if (!station) return;
    setTruckPoint(station.position);
    setManualPath([level.startNodeByStation[selectedStation]]);
    setSelectedRouteId("");
    const firstTruck = trucks.find((truck) => level.truckIds.includes(truck.id) && truck.stationId === selectedStation);
    if (firstTruck) setSelectedTruck(firstTruck.id);
  }, [selectedStation, level]);

  const selectedTruckData = trucks.find((truck) => truck.id === selectedTruck) as FireTruckType | undefined;
  const selectedStationPoint = stations.find((station) => station.id === selectedStation)?.position ?? { x: 0, y: 0 };

  const validRoutes = useMemo(() => {
    if (!level.routeOptions) return [];
    return level.routeOptions.filter((route) => {
      const nodePath = edgeIdsToNodePath(route.edgeIds, level.startNodeByStation[selectedStation]);
      return nodePath[0] === level.startNodeByStation[selectedStation] && nodePath[nodePath.length - 1] === level.targetNode;
    });
  }, [level, selectedStation]);

  const routePaths = validRoutes.map((route) => ({
    route,
    nodes: edgeIdsToNodePath(route.edgeIds, level.startNodeByStation[selectedStation])
  }));
  const selectedRoute = routePaths.find(({ route }) => route.id === selectedRouteId);

  const obstacleMarkers = useMemo(() => {
    const markers: { key: string; type: ObstacleType; point: Point }[] = [];
    cityEdges.forEach((edge) => {
      edge.obstacles?.forEach((type) => {
        const point = midpoint(cityNodes[edge.from], cityNodes[edge.to]);
        markers.push({ key: `${edge.id}-${type}`, type, point });
      });
    });
    if (level.weather === "rain") markers.push({ key: "rain", type: "rain", point: { x: 640, y: 62 } });
    return markers;
  }, [level.weather]);

  const svgPointFromEvent = (event: React.PointerEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewBox.width,
      y: ((event.clientY - rect.top) / rect.height) * viewBox.height
    };
  };

  const completeDispatch = (path: string[], routeName: string, actualTravelTime: number, event?: TripEvent) => {
    stopSiren();
    onBeep("arrival");
    setIsAnimating(false);
    setComicStage(-1);
    onFinish({
      stationId: selectedStation,
      truckId: selectedTruck,
      routeName,
      path,
      decisionTime: (Date.now() - levelStartedAt.current) / 1000,
      preparationTime: selectedTruckData?.preparationTime ?? 0,
      travelTime: actualTravelTime,
      tripEvent: event
    });
  };

  const animateAndFinish = (path: string[], routeName: string) => {
    if (!selectedTruckData || selectedTruckData.status !== "available") {
      setInvalid("Selecciona un carro disponible.");
      onBeep("blocked");
      return;
    }
    const total = pathCost(path, level.weather);
    if (!Number.isFinite(total) || path[path.length - 1] !== level.targetNode) {
      setInvalid("La ruta no llega por calles habilitadas.");
      onBeep("blocked");
      return;
    }
    setInvalid("");
    setIsAnimating(true);
    setTravelTime(0);
    setAwaitingDecision(false);
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    const event = generateTripEvent(level, path, selectedTruckData);
    const actualTravelTime = travelTimeWithUncertainty(level, path, selectedTruckData, event);
    currentEvent.current = event;
    currentTravelTime.current = actualTravelTime;
    setTripEvent(event);
    setComicStage(0);
    startSiren();
    const points = path.map((node) => cityNodes[node]);
    let index = 0;
    const stepMs = reducedMotion ? 80 : 620;
    const move = () => {
      setTruckPoint(points[index]);
      setTravelTime(Math.round((currentTravelTime.current * index / Math.max(1, points.length - 1)) * 10) / 10);
      setComicStage(Math.min(event ? 4 : 3, index === 0 ? 0 : index >= points.length - 1 ? (event ? 4 : 3) : index === 1 ? 1 : event ? 2 : 2));
      if (index < points.length - 1) {
        index += 1;
        if (event?.choiceRequired && index === Math.max(2, Math.floor(points.length / 2))) {
          setComicStage(3);
          setAwaitingDecision(true);
          setPendingFinish(() => () => {
            setAwaitingDecision(false);
            timers.current.push(window.setTimeout(move, stepMs));
          });
          return;
        }
        timers.current.push(window.setTimeout(move, stepMs));
      } else {
        timers.current.push(window.setTimeout(() => completeDispatch(path, routeName, currentTravelTime.current, currentEvent.current), reducedMotion ? 80 : 520));
      }
    };
    move();
  };

  const handleRouteDrop = (point: Point) => {
    const routeHit = routePaths.find(({ nodes }) => nodes.some((node) => distance(cityNodes[node], point) < 54));
    if (!routeHit) {
      setInvalid("Suelta el carro sobre una ruta marcada.");
      onBeep("blocked");
      return;
    }
    setSelectedRouteId(routeHit.route.id);
    onBeep("select");
  };

  const nearestNode = (point: Point) => {
    const candidates = Object.entries(cityNodes).map(([id, node]) => ({ id, node, distance: distance(point, node) }));
    return candidates.sort((a, b) => a.distance - b.distance)[0];
  };

  const handleManualMove = (point: Point) => {
    const candidate = nearestNode(point);
    if (!candidate || candidate.distance > 58) {
      setInvalid("Acércate a una intersección.");
      return;
    }
    const current = manualPath[manualPath.length - 1];
    if (candidate.id === current) return;
    if (!findEdgeBetween(current, candidate.id)) {
      setInvalid("Solo puedes avanzar por calles conectadas.");
      onBeep("blocked");
      return;
    }
    if (!isValidMove(current, candidate.id)) {
      setInvalid("Esa calle está cerrada o va en otro sentido.");
      onBeep("blocked");
      return;
    }
    setInvalid("");
    setTruckPoint(candidate.node);
    setManualPath((path) => [...path, candidate.id]);
    onBeep("select");
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (isAnimating) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    onBeep("select");
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || isAnimating) return;
    event.preventDefault();
    const point = svgPointFromEvent(event);
    if (level.manualRouting) handleManualMove(point);
    else setTruckPoint(point);
  };

  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || isAnimating) return;
    setDragging(false);
    if (!level.manualRouting) handleRouteDrop(svgPointFromEvent(event));
  };

  const manualComplete = manualPath[manualPath.length - 1] === level.targetNode;
  const selectedPath = level.manualRouting ? manualPath : selectedRoute?.nodes ?? [];
  const currentObstacles = collectObstacles(selectedPath, level.weather);
  const canDispatch = selectedTruckData?.status === "available" && (level.manualRouting ? manualComplete : Boolean(selectedRoute));
  const comicPanels = [
    { title: "Salida", text: `${selectedTruckData?.name ?? "Carro"} sale de ${stations.find((item) => item.id === selectedStation)?.name ?? "la compañía"}.`, sound: "¡En marcha!", icon: "🚒" },
    { title: "Ruta", text: `Ingreso a ${level.manualRouting ? "la ruta construida" : selectedRoute?.route.name ?? "la ruta seleccionada"}.`, sound: "¡Vamos!", icon: "🛣️" },
    { title: "Condiciones", text: currentObstacles.length ? currentObstacles.map((item) => OBSTACLE_LABELS[item]).join(", ") : "Recorrido sin obstáculos críticos.", sound: currentObstacles.includes("traffic") ? "¡Atasco!" : "¡Fluye!", icon: "⚠️" },
    { title: "Evento", text: tripEvent?.description ?? "No apareció un evento inesperado relevante.", sound: tripEvent?.onomatopoeia ?? "¡Controlado!", icon: "💥" },
    { title: "Llegada", text: `Destino: ${level.emergencyLabel}.`, sound: "¡Llegamos!", icon: "🏁" }
  ];
  const videoProgress = [4, 24, 52, 74, 92][Math.max(0, Math.min(4, comicStage))] ?? 4;
  const emergencyIcon = level.emergencyType === "crash" ? "🚗" : level.emergencyType === "school" ? "🏫" : "🔥";
  const visibleObstacleTypes = currentObstacles.filter((item) => item !== "oneway").slice(0, 4);
  const obstacleIcons: Record<ObstacleType, string> = {
    traffic: "🚗",
    closed: "⛔",
    works: "🚧",
    oneway: "↳",
    busy: "🚒",
    otherEmergency: "🚨",
    rain: "🌧️"
  };

  return (
    <main className="game-layout">
      <section className="map-shell" aria-label="Mapa de ciudad ficticia">
        <div className="map-topbar">
          <button className="icon-button" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Juegos</button>
          <Timer running={!isAnimating} resetKey={level.id} />
          <div className="travel-pill" aria-live="polite">
            Viaje: <strong>{travelTime}s</strong>
          </div>
          <AudioControls enabled={soundEnabled} onChange={setSoundEnabled} />
          <button className="icon-button" type="button" onClick={onRestart}><RotateCcw aria-hidden="true" /> Reiniciar</button>
        </div>
        {level.weather === "rain" ? <div className="rain-layer" aria-hidden="true" /> : null}
        <svg
          ref={svgRef}
          className={`city-map ${dragging ? "dragging" : ""} ${invalid ? "invalid" : ""}`}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          role="img"
          aria-label="Mapa con estaciones, calles, obstáculos y emergencia"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDragging(false)}
        >
          <rect width="820" height="620" fill="#eef7f8" />
          <path d="M0 360 C160 310 250 370 390 330 S650 280 820 335 L820 620 L0 620 Z" fill="#d8f0e5" />
          <path d="M0 92 C140 130 235 70 360 105 S615 150 820 80" className="river" />
          <rect x="455" y="36" width="95" height="58" rx="8" className="landmark hospital" />
          <text x="502" y="70" textAnchor="middle" className="landmark-text">
            Hospital
          </text>
          <rect x="588" y="448" width="78" height="58" rx="8" className="landmark school" />
          <text x="627" y="482" textAnchor="middle" className="landmark-text">
            Colegio
          </text>
          <rect x="42" y="455" width="74" height="54" rx="8" className="landmark park" />
          <text x="79" y="487" textAnchor="middle" className="landmark-text">
            Plaza
          </text>
          {cityEdges.map((edge) => (
            <line
              key={edge.id}
              x1={cityNodes[edge.from].x}
              y1={cityNodes[edge.from].y}
              x2={cityNodes[edge.to].x}
              y2={cityNodes[edge.to].y}
              className={`street ${edge.kind} ${edge.closed ? "closed" : ""}`}
            />
          ))}
          {routePaths.map(({ route, nodes }) => (
            <path
              key={route.id}
              d={pathD(nodes)}
              className={`route-option ${selectedRouteId === route.id ? "selected" : selectedRouteId ? "dimmed" : ""}`}
              style={{ stroke: route.color }}
              onClick={() => {
                if (isAnimating) return;
                setSelectedRouteId(route.id);
                setInvalid("");
                onBeep("select");
              }}
            />
          ))}
          {level.manualRouting && manualPath.length > 1 ? <path d={pathD(manualPath)} className="manual-path" /> : null}
          {Object.entries(cityNodes).map(([id, node]) => (
            <circle key={id} cx={node.x} cy={node.y} r="7" className="node" />
          ))}
          {stations
            .filter((station) => level.stationIds.includes(station.id))
            .map((station) => (
              <g key={station.id} className="station-pin" transform={`translate(${station.position.x} ${station.position.y})`}>
                <rect x="-33" y="-36" width="66" height="48" rx="8" />
                <text y="-7" textAnchor="middle">
                  {station.name.replace("Compañía ", "")}
                </text>
              </g>
            ))}
          {obstacleMarkers.map((marker) => <g key={marker.key} className={selectedRouteId && !currentObstacles.includes(marker.type) ? "obstacle-dimmed" : ""}><ObstacleMarker type={marker.type} point={marker.point} /></g>)}
          <EmergencyMarker level={level} />
          <FireTruck position={truckPoint} label={selectedTruckData?.icon ?? "B"} active dragging={dragging} />
        </svg>
        {isAnimating ? (
          <div className="comic-simulation" aria-live="polite">
            <div className={`dispatch-video stage-${Math.max(0, comicStage)}`} style={{ "--truck-progress": `${videoProgress}%` } as React.CSSProperties}>
              <div className="video-sky" aria-hidden="true"><span /> <span /> <span /></div>
              <div className="video-city" aria-hidden="true">
                <i /> <i /> <i /> <i />
              </div>
              <div className="video-station">
                <strong>Compañía</strong>
                <span>🚒</span>
                <div className="firefighters" aria-label="Bomberos subiendo al carro">
                  {["👨‍🚒", "👩‍🚒", "👨‍🚒"].map((person, index) => <b key={`${person}-${index}`}>{person}</b>)}
                </div>
              </div>
              <div className="video-emergency">
                <strong>{level.emergencyLabel}</strong>
                <span>{emergencyIcon}</span>
                <i />
              </div>
              <div className="video-road" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="video-obstacles" aria-label="Obstáculos visibles durante el trayecto">
                {visibleObstacleTypes.length ? visibleObstacleTypes.map((item, index) => (
                  <div className={`video-obstacle obstacle-${index}`} key={item}>
                    <span>{obstacleIcons[item]}</span>
                    <small>{OBSTACLE_LABELS[item]}</small>
                  </div>
                )) : <div className="video-obstacle obstacle-clear"><span>✅</span><small>Ruta despejada</small></div>}
              </div>
              {tripEvent ? (
                <div className="video-event">
                  <strong>{tripEvent.onomatopoeia}</strong>
                  <span>{tripEvent.label}</span>
                </div>
              ) : null}
              <div className="video-truck" aria-label={`${selectedTruckData?.name ?? "Carro"} avanzando`}>
                <span className="siren-light" />
                <span className="truck-cab">🚒</span>
                <small>{selectedTruckData?.icon ?? "B"}</small>
                <i />
              </div>
              <div className="video-caption">
                <strong>{comicPanels[Math.max(0, comicStage)]?.sound}</strong>
                <span>{comicPanels[Math.max(0, comicStage)]?.text}</span>
              </div>
              <div className="video-progress" aria-hidden="true">
                {comicPanels.map((panel, index) => <span className={index <= comicStage ? "active" : ""} key={panel.title} />)}
              </div>
            </div>
            {awaitingDecision ? (
              <div className="event-decision">
                <strong>{tripEvent?.label}</strong>
                <span>Decide cómo responder al evento.</span>
                <div className="action-row">
                  <button className="primary" type="button" onClick={() => pendingFinish?.()}>Continuar ruta</button>
                  <button className="secondary" type="button" onClick={() => {
                    if (currentEvent.current) {
                      currentEvent.current = { ...currentEvent.current, timeModifier: Math.max(-3, currentEvent.current.timeModifier - 2), label: "Recorrido recalculado" };
                      currentTravelTime.current = Math.max(1, Math.round((currentTravelTime.current - 2) * 10) / 10);
                      setTripEvent(currentEvent.current);
                    }
                    pendingFinish?.();
                  }}>Cambiar recorrido</button>
                  <button className="secondary" type="button" onClick={() => {
                    if (currentEvent.current) {
                      currentEvent.current = { ...currentEvent.current, timeModifier: Math.max(-4, currentEvent.current.timeModifier - 3), label: "Desvío tomado" };
                      currentTravelTime.current = Math.max(1, Math.round((currentTravelTime.current - 3) * 10) / 10);
                      setTripEvent(currentEvent.current);
                    }
                    pendingFinish?.();
                  }}>Tomar desvío</button>
                </div>
              </div>
            ) : null}
            <button className="secondary skip-animation" type="button" onClick={() => {
              if (!selectedPath.length) return;
              timers.current.forEach(window.clearTimeout);
              timers.current = [];
              completeDispatch(selectedPath, level.manualRouting ? "Ruta construida" : selectedRoute?.route.name ?? "Ruta seleccionada", currentTravelTime.current || Math.max(travelTime, travelTimeWithUncertainty(level, selectedPath, selectedTruckData, currentEvent.current)), currentEvent.current);
            }}>Omitir animación</button>
          </div>
        ) : null}
      </section>

      <aside className="side-panel" aria-label="Panel de decisiones">
        <p className="eyebrow">{level.title}</p>
        <h1>{level.subtitle}</h1>
        <p>{level.briefing}</p>

        <div className="choice-group">
          <span>Compañía</span>
          {availableStations.map((station) => (
            <StationButton
              key={station.id}
              station={station}
              selected={selectedStation === station.id}
              disabled={isAnimating}
              onSelect={() => setSelectedStation(station.id)}
            />
          ))}
        </div>

        <div className="choice-group">
          <span>Carro</span>
          {trucks
            .filter((truck) => level.truckIds.includes(truck.id) && truck.stationId === selectedStation)
            .map((truck) => (
              <button
                key={truck.id}
                type="button"
                className={`choice ${selectedTruck === truck.id ? "selected" : ""}`}
                disabled={isAnimating || truck.status !== "available"}
                onClick={() => setSelectedTruck(truck.id)}
              >
                <ShieldAlert aria-hidden="true" />
                <span>{truck.name}</span>
                <small>{truck.status === "available" ? `${truck.speed}/10 vel. · ${truck.preparationTime}s prep.` : OBSTACLE_LABELS.busy}</small>
              </button>
            ))}
        </div>

        {!level.manualRouting ? (
          <div className="choice-group">
            <span>Rutas</span>
            {routePaths.map(({ route, nodes }) => (
              <button
                key={route.id}
                type="button"
                className={`route-button ${selectedRouteId === route.id ? "selected" : ""}`}
                style={{ borderColor: route.color }}
                disabled={isAnimating}
                onClick={() => {
                  setSelectedRouteId(route.id);
                  setInvalid("");
                  onBeep("select");
                }}
              >
                <span>{route.name}</span>
                <small>{route.hint}</small>
                {selectedRouteId === route.id ? (
                  <div className="route-conditions">
                    <strong>Condiciones de la ruta</strong>
                    <div>
                      {collectObstacles(nodes, level.weather).length
                        ? collectObstacles(nodes, level.weather).map((item) => <em key={item}>{OBSTACLE_LABELS[item]}</em>)
                        : <em>Sin obstáculos importantes</em>}
                    </div>
                  </div>
                ) : null}
              </button>
            ))}
            <button
              className="primary dispatch-button"
              type="button"
              disabled={!canDispatch || isAnimating}
              onClick={() => selectedRoute && animateAndFinish(selectedRoute.nodes, selectedRoute.route.name)}
            >
              <Send aria-hidden="true" />
              Despachar carro
            </button>
          </div>
        ) : (
          <div className="manual-actions">
            <div className="path-status">
              <Check aria-hidden="true" />
              <span>{manualComplete ? "Ruta lista" : "Toca o arrastra por las intersecciones"}</span>
            </div>
            <button
              className="primary"
              type="button"
              disabled={!canDispatch || isAnimating}
              onClick={() => animateAndFinish(manualPath, "Ruta construida")}
            >
              <Send aria-hidden="true" />
              Despachar carro
            </button>
            <button
              className="secondary"
              type="button"
              disabled={isAnimating}
              onClick={() => {
                setManualPath([level.startNodeByStation[selectedStation]]);
                setTruckPoint(selectedStationPoint);
                setInvalid("");
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reiniciar ruta
            </button>
          </div>
        )}

        {invalid ? (
          <div className="feedback" role="alert">
            <AlertTriangle aria-hidden="true" />
            {invalid}
          </div>
        ) : null}

        {currentObstacles.length > 0 ? (
          <div className="mini-list">
            {currentObstacles.map((item) => (
              <span key={item}>{OBSTACLE_LABELS[item]}</span>
            ))}
          </div>
        ) : null}

        {level.weather === "rain" ? (
          <div className="weather-note">
            <CloudRain aria-hidden="true" />
            Lluvia: los tramos tardan 30% más.
          </div>
        ) : null}
      </aside>
    </main>
  );
}
