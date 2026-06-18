export type GameMode = "individual" | "team";
export type Difficulty = "explorador" | "rescatista" | "comandante";
export type GameScreen = "start" | "difficulty" | "playing" | "levelResult" | "finalResult";

export type ObstacleType =
  | "traffic"
  | "closed"
  | "works"
  | "oneway"
  | "busy"
  | "otherEmergency"
  | "rain";

export interface Point {
  x: number;
  y: number;
}

export interface FireStation {
  id: string;
  name: string;
  position: Point;
}

export interface FireTruck {
  id: string;
  name: string;
  stationId: string;
  preparationTime: number;
  status: "available" | "busy" | "otherEmergency";
  icon: string;
}

export interface StreetEdge {
  id: string;
  from: string;
  to: string;
  baseTime: number;
  kind: "avenue" | "street" | "secondary";
  bidirectional: boolean;
  closed?: boolean;
  obstacles?: ObstacleType[];
}

export interface RouteOption {
  id: string;
  name: string;
  color: string;
  edgeIds: string[];
  hint: string;
}

export interface LevelConfig {
  id: Difficulty;
  title: string;
  subtitle: string;
  emergencyType: "fire" | "crash" | "school";
  emergencyLabel: string;
  emergencyPosition: Point;
  stationIds: string[];
  truckIds: string[];
  startNodeByStation: Record<string, string>;
  targetNode: string;
  routeOptions?: RouteOption[];
  weather?: "clear" | "rain";
  manualRouting: boolean;
  briefing: string;
}

export interface LevelResultData {
  levelId: Difficulty;
  levelTitle: string;
  companyName: string;
  truckName: string;
  routeName: string;
  playerTime: number;
  optimalTime: number;
  decisionTime: number;
  score: number;
  stars: number;
  obstacles: ObstacleType[];
  explanation: string;
  playerPath: string[];
  optimalPath: string[];
}
