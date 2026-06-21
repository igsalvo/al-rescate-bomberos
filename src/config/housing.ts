export type HouseCase = {
  id: string;
  label: string;
  icon: string;
  size: number;
  rooms: number;
  transport: string;
  greenAreas: string;
  centerDistance: number;
  condition: string;
  modelValue: number;
  factors: Array<{ label: string; impact: number }>;
};

export const housingExamples: HouseCase[] = [
  { id: "example-1", label: "Departamento conectado", icon: "🏢", size: 62, rooms: 2, transport: "Muy cerca", greenAreas: "Pocas", centerDistance: 3, condition: "Excelente", modelValue: 520, factors: [{ label: "Transporte", impact: 90 }, { label: "Ubicación", impact: 84 }, { label: "Tamaño", impact: 46 }] },
  { id: "example-2", label: "Casa familiar", icon: "🏡", size: 145, rooms: 4, transport: "Distante", greenAreas: "Muchas", centerDistance: 12, condition: "Bueno", modelValue: 680, factors: [{ label: "Tamaño", impact: 94 }, { label: "Habitaciones", impact: 78 }, { label: "Áreas verdes", impact: 65 }] },
  { id: "example-3", label: "Vivienda a renovar", icon: "🏚️", size: 100, rooms: 3, transport: "Cerca", greenAreas: "Algunas", centerDistance: 7, condition: "Necesita mejoras", modelValue: 430, factors: [{ label: "Conservación", impact: 92 }, { label: "Tamaño", impact: 68 }, { label: "Transporte", impact: 60 }] }
];

export const housingRounds: HouseCase[] = [
  { id: "round-1", label: "Casa Los Aromos", icon: "🏠", size: 120, rooms: 3, transport: "A 5 minutos", greenAreas: "Cercanas", centerDistance: 8, condition: "Bueno", modelValue: 640, factors: [{ label: "Tamaño", impact: 88 }, { label: "Transporte", impact: 76 }, { label: "Conservación", impact: 68 }] },
  { id: "round-2", label: "Departamento Central", icon: "🏙️", size: 78, rooms: 2, transport: "Inmediato", greenAreas: "Escasas", centerDistance: 1, condition: "Excelente", modelValue: 610, factors: [{ label: "Ubicación", impact: 96 }, { label: "Transporte", impact: 91 }, { label: "Tamaño", impact: 52 }] },
  { id: "round-3", label: "Casa Parque Norte", icon: "🌳", size: 165, rooms: 4, transport: "A 15 minutos", greenAreas: "Amplias", centerDistance: 14, condition: "Muy bueno", modelValue: 730, factors: [{ label: "Tamaño", impact: 95 }, { label: "Áreas verdes", impact: 87 }, { label: "Distancia", impact: 70 }] },
  { id: "round-4", label: "Loft Estación", icon: "🚉", size: 52, rooms: 1, transport: "Inmediato", greenAreas: "Algunas", centerDistance: 5, condition: "Bueno", modelValue: 470, factors: [{ label: "Transporte", impact: 96 }, { label: "Tamaño", impact: 73 }, { label: "Ubicación", impact: 67 }] },
  { id: "round-5", label: "Casa Mirador", icon: "🌄", size: 135, rooms: 3, transport: "Distante", greenAreas: "Muchas", centerDistance: 18, condition: "Excelente", modelValue: 590, factors: [{ label: "Conservación", impact: 88 }, { label: "Tamaño", impact: 81 }, { label: "Distancia", impact: 78 }] }
];
