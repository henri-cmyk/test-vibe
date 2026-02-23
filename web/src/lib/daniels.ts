function vo2AtVelocity(vMPerMin: number) {
  // Daniels & Gilbert VO2 cost of running (m/min)
  return -4.60 + 0.182258 * vMPerMin + 0.000104 * vMPerMin * vMPerMin;
}

function fractionUtilized(tMinutes: number) {
  // Fraction of VO2max sustainable for duration t (minutes)
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * tMinutes) +
    0.2989558 * Math.exp(-0.1932605 * tMinutes)
  );
}

export function vdotFromRace(distanceMeters: number, timeSeconds: number): number {
  const tMin = timeSeconds / 60;
  const v = distanceMeters / tMin; // m/min
  const vo2 = vo2AtVelocity(v);
  const frac = fractionUtilized(tMin);
  const vdot = vo2 / frac;
  if (!Number.isFinite(vdot)) return 0;
  return Math.max(10, Math.min(95, vdot));
}

export function vdotFromVo2max(vo2max: number): number {
  // Very rough proxy (VDOT is typically slightly below VO2max for many runners).
  const vdot = 0.9 * vo2max;
  if (!Number.isFinite(vdot)) return 0;
  return Math.max(10, Math.min(95, vdot));
}

export function raceTimeFromVdot(
  distanceMeters: number,
  vdot: number,
): number {
  // Binary search on time. Monotonic: higher time => lower VDOT.
  const target = Math.max(10, Math.min(95, vdot));

  // Rough bounds: 10k between 25min and 2h, marathon between 2h and 7h.
  // We'll widen to be safe.
  let lo = 10 * 60; // 10 min
  let hi = 12 * 3600; // 12 h

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const cur = vdotFromRace(distanceMeters, mid);
    if (cur > target) {
      // Too "good" => time too small
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return Math.round((lo + hi) / 2);
}

