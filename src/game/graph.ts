import type { Point, StreetEdge } from "./types";

export const cityNodes: Record<string, Point> = {
  a: { x: 90, y: 120 },
  b: { x: 230, y: 110 },
  c: { x: 390, y: 105 },
  d: { x: 545, y: 120 },
  e: { x: 720, y: 125 },
  f: { x: 105, y: 265 },
  g: { x: 245, y: 255 },
  h: { x: 395, y: 255 },
  i: { x: 550, y: 265 },
  j: { x: 720, y: 270 },
  k: { x: 90, y: 410 },
  l: { x: 245, y: 410 },
  m: { x: 400, y: 405 },
  n: { x: 555, y: 420 },
  o: { x: 710, y: 410 },
  p: { x: 145, y: 535 },
  q: { x: 335, y: 540 },
  r: { x: 540, y: 540 },
  s: { x: 710, y: 535 }
};

export const cityEdges: StreetEdge[] = [
  { id: "a-b", from: "a", to: "b", baseTime: 4, kind: "avenue", bidirectional: true },
  { id: "b-c", from: "b", to: "c", baseTime: 3, kind: "avenue", bidirectional: true, obstacles: ["traffic"] },
  { id: "c-d", from: "c", to: "d", baseTime: 3, kind: "avenue", bidirectional: true },
  { id: "d-e", from: "d", to: "e", baseTime: 4, kind: "street", bidirectional: true },
  { id: "a-f", from: "a", to: "f", baseTime: 5, kind: "secondary", bidirectional: true },
  { id: "b-g", from: "b", to: "g", baseTime: 4, kind: "street", bidirectional: true },
  { id: "c-h", from: "c", to: "h", baseTime: 4, kind: "street", bidirectional: false, obstacles: ["oneway"] },
  { id: "d-i", from: "d", to: "i", baseTime: 4, kind: "street", bidirectional: true, obstacles: ["works"] },
  { id: "e-j", from: "e", to: "j", baseTime: 5, kind: "secondary", bidirectional: true },
  { id: "f-g", from: "f", to: "g", baseTime: 4, kind: "street", bidirectional: true },
  { id: "g-h", from: "g", to: "h", baseTime: 4, kind: "avenue", bidirectional: true },
  { id: "h-i", from: "h", to: "i", baseTime: 3, kind: "avenue", bidirectional: true },
  { id: "i-j", from: "i", to: "j", baseTime: 4, kind: "street", bidirectional: true, obstacles: ["traffic"] },
  { id: "f-k", from: "f", to: "k", baseTime: 5, kind: "secondary", bidirectional: true },
  { id: "g-l", from: "g", to: "l", baseTime: 4, kind: "street", bidirectional: true },
  { id: "h-m", from: "h", to: "m", baseTime: 4, kind: "street", bidirectional: true, closed: true, obstacles: ["closed"] },
  { id: "i-n", from: "i", to: "n", baseTime: 4, kind: "street", bidirectional: false, obstacles: ["oneway"] },
  { id: "j-o", from: "j", to: "o", baseTime: 4, kind: "street", bidirectional: true },
  { id: "k-l", from: "k", to: "l", baseTime: 5, kind: "secondary", bidirectional: true, obstacles: ["works"] },
  { id: "l-m", from: "l", to: "m", baseTime: 4, kind: "street", bidirectional: true },
  { id: "m-n", from: "m", to: "n", baseTime: 3, kind: "avenue", bidirectional: true },
  { id: "n-o", from: "n", to: "o", baseTime: 3, kind: "avenue", bidirectional: true },
  { id: "k-p", from: "k", to: "p", baseTime: 6, kind: "secondary", bidirectional: true },
  { id: "l-q", from: "l", to: "q", baseTime: 5, kind: "street", bidirectional: true },
  { id: "m-q", from: "m", to: "q", baseTime: 5, kind: "street", bidirectional: true },
  { id: "n-r", from: "n", to: "r", baseTime: 4, kind: "avenue", bidirectional: true },
  { id: "o-s", from: "o", to: "s", baseTime: 4, kind: "street", bidirectional: true },
  { id: "p-q", from: "p", to: "q", baseTime: 4, kind: "avenue", bidirectional: true },
  { id: "q-r", from: "q", to: "r", baseTime: 3, kind: "avenue", bidirectional: true, obstacles: ["traffic"] },
  { id: "r-s", from: "r", to: "s", baseTime: 4, kind: "street", bidirectional: true }
];

export const edgeById = new Map(cityEdges.map((edge) => [edge.id, edge]));
