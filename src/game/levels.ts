import { ROUTE_COLORS } from "../config/theme";
import type { FireStation, FireTruck, LevelConfig } from "./types";

export const stations: FireStation[] = [
  { id: "central", name: "Compania Central", position: { x: 90, y: 120 } },
  { id: "parque", name: "Compania Parque", position: { x: 720, y: 125 } },
  { id: "rio", name: "Compania Rio", position: { x: 145, y: 535 } }
];

export const trucks: FireTruck[] = [
  {
    id: "b1",
    name: "Bomba 1",
    stationId: "central",
    preparationTime: 2,
    status: "available",
    icon: "B1"
  },
  {
    id: "r2",
    name: "Rescate 2",
    stationId: "parque",
    preparationTime: 3,
    status: "available",
    icon: "R2"
  },
  {
    id: "q3",
    name: "Quimico 3",
    stationId: "central",
    preparationTime: 5,
    status: "busy",
    icon: "Q3"
  },
  {
    id: "e4",
    name: "Escala 4",
    stationId: "rio",
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
    emergencyPosition: { x: 555, y: 420 },
    stationIds: ["central"],
    truckIds: ["b1"],
    startNodeByStation: { central: "a" },
    targetNode: "n",
    manualRouting: false,
    weather: "clear",
    briefing: "Arrastra el carro hacia una ruta. El camino corto puede tener mas trafico.",
    routeOptions: [
      {
        id: "corta",
        name: "Ruta corta",
        color: ROUTE_COLORS.orange,
        edgeIds: ["a-b", "b-c", "c-d", "d-i", "i-n"],
        hint: "Mas directa, pero con trafico y trabajos."
      },
      {
        id: "avenida",
        name: "Ruta avenida",
        color: ROUTE_COLORS.blue,
        edgeIds: ["a-f", "f-g", "g-h", "h-i", "i-n"],
        hint: "Un poco mas larga, con tramos rapidos."
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
    id: "rescatista",
    title: "Nivel 2: Rescatista",
    subtitle: "Accidente vehicular",
    emergencyType: "crash",
    emergencyLabel: "Accidente",
    emergencyPosition: { x: 400, y: 405 },
    stationIds: ["central", "parque"],
    truckIds: ["b1", "r2", "q3"],
    startNodeByStation: { central: "a", parque: "e" },
    targetNode: "m",
    manualRouting: false,
    weather: "clear",
    briefing: "Elige compania, carro disponible y ruta. El mas cercano no siempre llega antes.",
    routeOptions: [
      {
        id: "centro",
        name: "Centro",
        color: ROUTE_COLORS.orange,
        edgeIds: ["a-b", "b-c", "c-h", "h-m"],
        hint: "Directa, pero una calle esta cerrada."
      },
      {
        id: "ribera",
        name: "Ribera",
        color: ROUTE_COLORS.blue,
        edgeIds: ["a-f", "f-g", "g-l", "l-m"],
        hint: "Mas estable y sin cierre."
      },
      {
        id: "parque",
        name: "Desde parque",
        color: ROUTE_COLORS.green,
        edgeIds: ["e-j", "j-o", "o-s", "r-s", "n-r", "m-n"],
        hint: "Parte mas lejos, pero evita la zona cerrada."
      }
    ]
  },
  {
    id: "comandante",
    title: "Nivel 3: Comandante",
    subtitle: "Emergencia en un colegio",
    emergencyType: "school",
    emergencyLabel: "Colegio",
    emergencyPosition: { x: 710, y: 535 },
    stationIds: ["central", "parque", "rio"],
    truckIds: ["b1", "r2", "q3", "e4"],
    startNodeByStation: { central: "a", parque: "e", rio: "p" },
    targetNode: "s",
    manualRouting: true,
    weather: "rain",
    briefing: "Construye el recorrido por la red. Respeta cierres y sentidos del transito."
  }
];

export function getLevel(id: string): LevelConfig {
  const level = levels.find((item) => item.id === id);
  if (!level) throw new Error(`Nivel desconocido: ${id}`);
  return level;
}

export const levelOrder = levels.map((level) => level.id);
