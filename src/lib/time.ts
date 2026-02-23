export function parseHmsToSeconds(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  const parts = raw.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n))) return null;

  const [a, b, c] = nums;
  const h = parts.length === 3 ? a : 0;
  const m = parts.length === 3 ? b : a;
  const s = parts.length === 3 ? c : b;

  if (m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}

export function formatSecondsToHms(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

