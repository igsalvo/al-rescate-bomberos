import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CloudRain, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { OBSTACLE_LABELS } from "../config/content";
import { cityEdges, cityNodes } from "../game/graph";
import { stations, trucks } from "../game/levels";
import { collectObstacles, edgeIdsToNodePath, findEdgeBetween, isValidMove, pathCost } from "../game/pathfinding";
import type { FireTruck as FireTruckType, LevelConfig, ObstacleType, Point } from "../game/types";
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

export function GameMap({
  level,
  soundEnabled,
  setSoundEnabled,
  onBeep,
  startSiren,
  stopSiren,
  reducedMotion,
  onFinish
}: {
  level: LevelConfig;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onBeep: (name: "select" | "blocked" | "arrival" | "result" | "alarm") => void;
  startSiren: () => void;
  stopSiren: () => void;
  reducedMotion: boolean;
  onFinish: (params: { stationId: string; truckId: string; routeName: string; path: string[]; decisionTime: number }) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const levelStartedAt = useRef(Date.now());
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

  useEffect(() => {
    levelStartedAt.current = Date.now();
    const firstStation = availableStations[0]?.id ?? "";
    setSelectedStation(firstStation);
    setSelectedTruck(trucks.find((truck) => level.truckIds.includes(truck.id) && truck.stationId === firstStation)?.id ?? level.truckIds[0]);
    setTruckPoint(stations.find((station) => station.id === firstStation)?.position ?? { x: 0, y: 0 });
    setManualPath([level.startNodeByStation[firstStation]]);
    setInvalid("");
    setTravelTime(0);
  }, [level.id]);

  useEffect(() => {
    const station = stations.find((item) => item.id === selectedStation);
    if (!station) return;
    setTruckPoint(station.position);
    setManualPath([level.startNodeByStation[selectedStation]]);
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
    startSiren();
    const points = path.map((node) => cityNodes[node]);
    let index = 0;
    const stepMs = reducedMotion ? 80 : 520;
    const move = () => {
      setTruckPoint(points[index]);
      setTravelTime(Math.round(pathCost(path.slice(0, index + 1), level.weather) * 10) / 10);
      if (index < points.length - 1) {
        index += 1;
        window.setTimeout(move, stepMs);
      } else {
        stopSiren();
        onBeep("arrival");
        window.setTimeout(() => {
          setIsAnimating(false);
          onFinish({
            stationId: selectedStation,
            truckId: selectedTruck,
            routeName,
            path,
            decisionTime: (Date.now() - levelStartedAt.current) / 1000
          });
        }, reducedMotion ? 80 : 420);
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
    animateAndFinish(routeHit.nodes, routeHit.route.name);
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
  const currentObstacles = collectObstacles(level.manualRouting ? manualPath : [], level.weather);

  return (
    <main className="game-layout">
      <section className="map-shell" aria-label="Mapa de ciudad ficticia">
        <div className="map-topbar">
          <Timer running={!isAnimating} resetKey={level.id} />
          <div className="travel-pill" aria-live="polite">
            Viaje: <strong>{travelTime}s</strong>
          </div>
          <AudioControls enabled={soundEnabled} onChange={setSoundEnabled} />
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
              className="route-option"
              style={{ stroke: route.color }}
              onClick={() => !isAnimating && animateAndFinish(nodes, route.name)}
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
          {obstacleMarkers.map((marker) => (
            <ObstacleMarker key={marker.key} type={marker.type} point={marker.point} />
          ))}
          <EmergencyMarker level={level} />
          <FireTruck position={truckPoint} label={selectedTruckData?.icon ?? "B"} active dragging={dragging} />
        </svg>
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
                <small>{truck.status === "available" ? `${truck.preparationTime}s prep.` : OBSTACLE_LABELS.busy}</small>
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
                className="route-button"
                style={{ borderColor: route.color }}
                disabled={isAnimating}
                onClick={() => animateAndFinish(nodes, route.name)}
              >
                <span>{route.name}</span>
                <small>{route.hint}</small>
              </button>
            ))}
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
              disabled={!manualComplete || isAnimating}
              onClick={() => animateAndFinish(manualPath, "Ruta construida")}
            >
              <Send aria-hidden="true" />
              ¡Enviar carro!
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
