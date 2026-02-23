import { UTMB_WORLD_SERIES_RACES } from "@/data/races";
import { SAMPLE_PERFORMANCES } from "@/data/sample-performances";
import { raceTimeFromVdot } from "@/lib/daniels";
import { computeEffectiveUtmbIndex } from "@/lib/profile";
import { gaussianWeight, weightedQuantile } from "@/lib/stats";
import { EstimateRequest, EstimateResult, UtmbRace } from "@/lib/types";

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function kmEffort(distanceKm: number, elevationGainM: number) {
  return distanceKm + elevationGainM / 100;
}

function expectedSpeedKmH(index: number) {
  return 7.2 + (index - 450) / 80;
}

function fallbackTimeSeconds(race: UtmbRace, index: number) {
  const effort = kmEffort(race.distanceKm, race.elevationGainM);
  const speed = clamp(expectedSpeedKmH(index), 4.2, 13.8);
  const hours = effort / speed;
  return Math.round(hours * 3600);
}

export function estimateFinishTime(req: EstimateRequest): EstimateResult {
  const race = UTMB_WORLD_SERIES_RACES.find((r) => r.id === req.raceId);
  if (!race) {
    throw new Error("Race inconnue.");
  }

  const { effectiveUtmbIndex, notes: profileNotes } = computeEffectiveUtmbIndex(
    req.profile,
  );

  const raceRows = SAMPLE_PERFORMANCES.filter((p) => p.raceId === race.id);
  const notes = [...profileNotes];

  if (raceRows.length === 0) {
    const t = fallbackTimeSeconds(race, effectiveUtmbIndex);
    notes.push("Aucune donnée historique: fallback paramétrique.");
    return {
      race,
      effectiveUtmbIndex,
      sampleSize: 0,
      estimate: { p10Seconds: t, p50Seconds: t, p90Seconds: t },
      notes,
    };
  }

  const sigma = 30;
  const times = raceRows.map((r) => r.finishTimeSeconds);
  const weights = raceRows.map((r) =>
    gaussianWeight(r.utmbIndex - effectiveUtmbIndex, sigma),
  );

  const p10 = weightedQuantile(times, weights, 0.1);
  const p50 = weightedQuantile(times, weights, 0.5);
  const p90 = weightedQuantile(times, weights, 0.9);

  const bucket = raceRows.filter(
    (r) => Math.abs(r.utmbIndex - effectiveUtmbIndex) <= 25,
  );
  const bestObservedSeconds =
    bucket.length >= 5
      ? Math.min(...bucket.map((b) => b.finishTimeSeconds))
      : undefined;
  const worstObservedSeconds =
    bucket.length >= 5
      ? Math.max(...bucket.map((b) => b.finishTimeSeconds))
      : undefined;

  const base = fallbackTimeSeconds(race, effectiveUtmbIndex);
  const p10Seconds = p10 ?? Math.round(base * 0.9);
  const p50Seconds = p50 ?? base;
  const p90Seconds = p90 ?? Math.round(base * 1.15);

  notes.push(
    "Données historiques: jeu synthétique (MVP). Branchez une ingestion de résultats réels pour fiabiliser.",
  );

  const vdot = clamp(effectiveUtmbIndex / 12.5, 10, 95);
  const roadEquivalences = {
    vdot: Math.round(vdot * 10) / 10,
    t10kSeconds: raceTimeFromVdot(10000, vdot),
    thmSeconds: raceTimeFromVdot(21097.5, vdot),
    tmSeconds: raceTimeFromVdot(42195, vdot),
  };

  return {
    race,
    effectiveUtmbIndex,
    sampleSize: raceRows.length,
    estimate: {
      p10Seconds,
      p50Seconds,
      p90Seconds,
      bestObservedSeconds,
      worstObservedSeconds,
    },
    roadEquivalences,
    notes,
  };
}

