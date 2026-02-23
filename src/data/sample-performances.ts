import { UTMB_WORLD_SERIES_RACES } from "@/data/races";
import { AthletePerformance } from "@/lib/types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function randn(rng: () => number) {
  // Box-Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function kmEffort(distanceKm: number, elevationGainM: number) {
  return distanceKm + elevationGainM / 100;
}

function expectedSpeedKmH(index: number) {
  // A smooth, plausible mapping: +~1 km/h per +80 UTMB Index.
  return 7.2 + (index - 450) / 80;
}

function syntheticTimeHoursForRace(
  race: { distanceKm: number; elevationGainM: number },
  index: number,
  rng: () => number,
) {
  const effort = kmEffort(race.distanceKm, race.elevationGainM);
  const speed = clamp(expectedSpeedKmH(index), 4.5, 13.5);
  const base = effort / speed;

  // Add noise (fat tail) to mimic bad days, heat, GI, etc.
  const noise = Math.exp(0.18 * randn(rng)); // ~ +/- 20-25%
  return base * noise;
}

export function generateSamplePerformances(): AthletePerformance[] {
  const seed = 20260223;
  const rng = mulberry32(seed);
  const rows: AthletePerformance[] = [];

  for (const race of UTMB_WORLD_SERIES_RACES) {
    const n =
      race.category === "20K"
        ? 200
        : race.category === "50K"
          ? 260
          : race.category === "100K"
            ? 320
            : 380;

    for (let i = 0; i < n; i++) {
      // Index distribution depends on category (roughly).
      const center =
        race.category === "20K"
          ? 520
          : race.category === "50K"
            ? 560
            : race.category === "100K"
              ? 585
              : 600;
      const spread = race.category === "100M" ? 85 : 75;
      const utmbIndex = Math.round(clamp(center + randn(rng) * spread, 300, 850));
      const hours = syntheticTimeHoursForRace(race, utmbIndex, rng);
      const finishTimeSeconds = Math.round(hours * 3600);

      rows.push({
        raceId: race.id,
        utmbIndex,
        finishTimeSeconds,
        year: 2024 + Math.floor(rng() * 2),
        source: "sample",
      });
    }
  }

  return rows;
}

export const SAMPLE_PERFORMANCES: AthletePerformance[] =
  generateSamplePerformances();

