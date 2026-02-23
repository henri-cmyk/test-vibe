export type TrailClassic = {
  id: string;
  name: string;
  distanceKm: number;
  elevationGainM: number;
};

// A few well-known classics (starter list).
export const TRAIL_CLASSICS: TrailClassic[] = [
  { id: "saintelyon", name: "SaintéLyon", distanceKm: 78, elevationGainM: 2400 },
  {
    id: "templiers-80k",
    name: "Festival des Templiers (80K)",
    distanceKm: 80,
    elevationGainM: 3500,
  },
  { id: "maxi-race", name: "Maxi-Race Annecy (87K)", distanceKm: 87, elevationGainM: 5300 },
  { id: "ut4m-80k", name: "UT4M (80K)", distanceKm: 80, elevationGainM: 5500 },
  { id: "diagonale", name: "Grand Raid - Diagonale des Fous", distanceKm: 165, elevationGainM: 10000 },
];

