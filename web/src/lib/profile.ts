import { vdotFromRace, vdotFromVo2max } from "@/lib/daniels";
import { ProfileInput } from "@/lib/types";

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function utmbIndexFromVdot(vdot: number) {
  // Rough scaling: VDOT 40 -> ~500, VDOT 60 -> ~750
  return 12.5 * vdot;
}

export function computeEffectiveUtmbIndex(profile: ProfileInput): {
  effectiveUtmbIndex: number;
  notes: string[];
} {
  const notes: string[] = [];
  const sources: { label: string; value: number; weight: number }[] = [];

  if (isFiniteNumber(profile.utmbIndex)) {
    sources.push({
      label: "UTMB Index fourni",
      value: profile.utmbIndex,
      weight: 0.7,
    });
  }

  if (isFiniteNumber(profile.itra)) {
    sources.push({
      label: "Cote ITRA (proxy)",
      value: profile.itra,
      weight: 0.45,
    });
  }

  if (isFiniteNumber(profile.vo2max)) {
    const vdot = vdotFromVo2max(profile.vo2max);
    sources.push({
      label: "VO2max montre (proxy VDOT)",
      value: utmbIndexFromVdot(vdot),
      weight: 0.2,
    });
  }

  if (profile.road.length > 0) {
    const roadToMeters: Record<string, number> = {
      "10K": 10000,
      HM: 21097.5,
      M: 42195,
    };
    const vdots = profile.road
      .map((r) => {
        const dist = roadToMeters[r.distance];
        if (!dist || !isFiniteNumber(r.timeSeconds) || r.timeSeconds <= 0)
          return null;
        return vdotFromRace(dist, r.timeSeconds);
      })
      .filter((x): x is number => x !== null);

    if (vdots.length > 0) {
      const best = Math.max(...vdots);
      sources.push({
        label: "Référence route (VDOT Daniels)",
        value: utmbIndexFromVdot(best),
        weight: 0.35,
      });
    }
  }

  if (profile.trail.length > 0) {
    notes.push(
      "Temps sur classiques trail: pris en compte à terme (MVP: non utilisé).",
    );
  }

  if (sources.length === 0) {
    notes.push(
      "Aucun indicateur de performance fourni: estimation basée sur un profil générique (incertitude élevée).",
    );
    return { effectiveUtmbIndex: 500, notes };
  }

  const totalW = sources.reduce((acc, s) => acc + s.weight, 0);
  const blended = sources.reduce((acc, s) => acc + s.value * s.weight, 0) / totalW;
  const effectiveUtmbIndex = Math.round(clamp(blended, 250, 900));

  if (!isFiniteNumber(profile.utmbIndex)) {
    notes.push(
      "UTMB Index non fourni: valeur 'effective' déduite de proxies (incertitude plus élevée).",
    );
  } else {
    notes.push("UTMB Index fourni: utilisé comme source principale.");
  }

  return { effectiveUtmbIndex, notes };
}

