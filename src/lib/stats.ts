export function gaussianWeight(diff: number, sigma: number) {
  const z = diff / sigma;
  return Math.exp(-0.5 * z * z);
}

export function weightedQuantile(
  values: number[],
  weights: number[],
  q: number,
): number | null {
  if (values.length === 0) return null;
  if (values.length !== weights.length) return null;
  if (!(q >= 0 && q <= 1)) return null;

  const pairs = values
    .map((v, i) => ({ v, w: weights[i] }))
    .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.w) && p.w > 0)
    .sort((a, b) => a.v - b.v);

  const total = pairs.reduce((acc, p) => acc + p.w, 0);
  if (total <= 0) return null;

  const target = q * total;
  let cum = 0;
  for (const p of pairs) {
    cum += p.w;
    if (cum >= target) return p.v;
  }
  return pairs[pairs.length - 1]?.v ?? null;
}

