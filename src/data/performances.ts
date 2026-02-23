import real from "@/data/real-performances.json";
import { SAMPLE_PERFORMANCES } from "@/data/sample-performances";
import { AthletePerformance } from "@/lib/types";

function isAthletePerformance(x: unknown): x is AthletePerformance {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.raceId === "string" &&
    typeof r.utmbIndex === "number" &&
    Number.isFinite(r.utmbIndex) &&
    typeof r.finishTimeSeconds === "number" &&
    Number.isFinite(r.finishTimeSeconds)
  );
}

export const REAL_PERFORMANCES: AthletePerformance[] = Array.isArray(real)
  ? real.filter(isAthletePerformance)
  : [];

export const PERFORMANCES: AthletePerformance[] =
  REAL_PERFORMANCES.length > 0 ? REAL_PERFORMANCES : SAMPLE_PERFORMANCES;

export const PERFORMANCES_SOURCE: "real" | "sample" =
  REAL_PERFORMANCES.length > 0 ? "real" : "sample";

