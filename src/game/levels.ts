import { ROUTE_COLORS } from "../config/theme";
import type { FireStation, FireTruck, LevelConfig } from "./types";

export const stations: FireStation[] = [
  { id: "central", name: "Compañía Central", position: { x: 90, y: 120 } },
  { id: "parque", name: "Compañía Parque", position: { x: 720, y: 125 } },
  { id: "rio", name: "Compañía Río", position: { x: 145, y: 535 } }
];

export const trucks: FireTruck[] = [
  {
    id: "b1",
    name: "Bomba 1",
    stationId: "central",
    type: "bomba",
    speed: 7,
    waterCapacity: 3200,
    bestFor: ["fire", "school"],
    roadCompatibility: ["avenue", "street"],
    resourceLevel: 7,
    preparationTime: 2,
    status: "available",
    icon: "B1"
  },
  {
    id: "r2",
    name: "Rescate 2",
    stationId: "parque",
    type: "rescate",
    speed: 9,
    bestFor: ["crash", "school"],
    roadCompatibility: ["avenue", "street", "secondary"],
    resourceLevel: 5,
    preparationTime: 3,
    status: "available",
    icon: "R2"
  },
  {
    id: "q3",
    name: "Químico 3",
    stationId: "central",
    type: "quimico",
    speed: 6,
    waterCapacity: 1800,
    bestFor: ["fire"],
    roadCompatibility: ["avenue", "street"],
    resourceLevel: 9,
    preparationTime: 5,
    status: "busy",
    icon: "Q3"
  },
  {
    id: "e4",
    name: "Escala 4",
    stationId: "rio",
    type: "escala",
    speed: 5,
    waterCapacity: 1200,
    bestFor: ["fire", "school"],
    roadCompatibility: ["avenue"],
    resourceLevel: 10,
    preparationTime: 4,
    status: "available",
    icon: "E4"
  }
];

export const levels: LevelConfig[] = [
  {
    id: "explorador",
    title: "Nivel 1: Explorador",
    subtitle: "Incendio en una vivienda",
    emergencyType: "fire",
    emergencyLabel: "Vivienda",
    emergencyDescription: "Se reporta humo y fuego en una vivienda cercana al colegio. Debes elegir un carro adecuado y confirmar una ruta segura.",
    priority: "Alta",
    recommendedTruckTypes: ["bomba"],
    emergencyPosition: { x: 555, y: 420 },
    stationIds: ["central"],
    truckIds: ["b1"],
    startNodeByStation: { central: "a" },
    targetNode: "n",
    manualRouting: false,
    weather: "clear",
    briefing: "Elige el carro y una ruta. Puedes cambiar tu decisión antes de despachar.",
    routeOptions: [
      {
        id: "corta",
        name: "Ruta corta",
        color: ROUTE_COLORS.orange,
        edgeIds: ["a-b", "b-c", "c-d", "d-i", "i-n"],
        hint: "Más directa, pero con tráfico y trabajos."
      },
      {
        id: "avenida",
        name: "Ruta avenida",
        color: ROUTE_COLORS.blue,
        edgeIds: ["a-f", "f-g", "g-h", "h-i", "i-n"],
        hint: "Un poco más larga, con tramos rápidos."
      },
      {
        id: "barrio",
        name: "Ruta barrio",
        color: ROUTE_COLORS.green,
        edgeIds: ["a-f", "f-k", "k-l", "l-m", "m-n"],
        hint: "Evita el centro, pero usa calles secundarias."
      }
    ]
  },
  {
    id: "operador",
    title: "Nivel 2: Operador",
    subtitle: "Accidente vehicular",
    emergencyType: "crash",
    emergencyLabel: "Accidente",
    emergencyDescription: "Un accidente de tránsito bloquea parte de la red. Se requiere respuesta rápida y un vehículo compatible con rescate.",
    priority: "Alta",
    recommendedTruckTypes: ["rescate", "bomba"],
    emergencyPosition: { x: 400, y: 405 },
    stationIds: ["central", "parque"],
    truckIds: ["b1", "r2", "q3"],
    startNodeByStation: { central: "a", parque: "e" },
    targetNode: "m",
    manualRouting: false,
    weather: "clear",
    briefing: "Elige compañía, carro disponible y ruta. El más cercano no siempre llega antes.",
    routeOptions: [
      {
        id: "centro",
        name: "Centro",
        color: ROUTE_COLORS.orange,
        edgeIds: ["a-b", "b-c", "c-h", "h-m"],
        hint: "Directa, pero una calle está cerrada."
      },
      {
        id: "ribera",
        name: "Ribera",
        color: ROUTE_COLORS.blue,
        edgeIds: ["a-f", "f-g", "g-l", "l-m"],
        hint: "Más estable y sin cierre."
      },
      {
        id: "parque",
        name: "Desde parque",
        color: ROUTE_COLORS.green,
        edgeIds: ["e-j", "j-o", "o-s", "r-s", "n-r", "m-n"],
        hint: "Parte más lejos, pero evita la zona cerrada."
      }
    ]
  },
  {
    id: "comandante",
    title: "Nivel 3: Comandante",
    subtitle: "Emergencia en un colegio",
    emergencyType: "school",
    emergencyLabel: "Colegio",
    emergencyDescription: "Hay una emergencia en un colegio durante horario de clases. La decisión debe equilibrar rapidez, seguridad y uso de recursos.",
    priority: "Crítica",
    recommendedTruckTypes: ["bomba", "rescate", "escala"],
    emergencyPosition: { x: 710, y: 535 },
    stationIds: ["central", "parque", "rio"],
    truckIds: ["b1", "r2", "q3", "e4"],
    startNodeByStation: { central: "a", parque: "e", rio: "p" },
    targetNode: "s",
    manualRouting: true,
    weather: "rain",
    briefing: "Construye el recorrido por la red. Respeta cierres y sentidos del tránsito antes de despachar."
  }
];

export function getLevel(id: string): LevelConfig {
  const level = levels.find((item) => item.id === id);
  if (!level) throw new Error(`Nivel desconocido: ${id}`);
  return level;
}

export const levelOrder = levels.map((level) => level.id);
