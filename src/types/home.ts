export interface Person { id: string; number: string; name: string; team: string }
export interface Hobby { id: string; code: string; title: string; accent: string; frequency: string; description: string; people: Person[] }
export interface Message { role: 'assistant' | 'user'; content: string }
export interface Province { adcode: number; name: string; shortName: string; path: string; labelX: number; labelY: number; insetPath: string }
export interface MapGeometry {
  CHINA_PROVINCES: Province[]; NINE_DASH_PATH: string; NINE_DASH_INSET_PATH: string;
  SOUTH_CHINA_SEA_ISLANDS: { name: string; center: number[] }[];
  MAP_VIEWBOX: string; INSET_VIEWBOX: { x: number; y: number; w: number; h: number };
}
