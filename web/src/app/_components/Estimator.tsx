"use client";

import { TRAIL_CLASSICS } from "@/data/trail-classics";
import { formatSecondsToHms, parseHmsToSeconds } from "@/lib/time";
import type { EstimateResult, UtmbRace } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type FormState = {
  utmbIndex: string;
  itra: string;
  vo2max: string;
  t10k: string;
  thm: string;
  tm: string;
  classicId: string;
  classicTime: string;
};

const initialForm: FormState = {
  utmbIndex: "",
  itra: "",
  vo2max: "",
  t10k: "",
  thm: "",
  tm: "",
  classicId: "saintelyon",
  classicTime: "",
};

function toNumberOrUndefined(s: string) {
  const raw = s.trim();
  if (!raw) return undefined;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function RaceBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      {children}
    </span>
  );
}

export function Estimator() {
  const [races, setRaces] = useState<UtmbRace[]>([]);
  const [raceId, setRaceId] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/races");
        const json = (await res.json()) as { races: UtmbRace[] };
        if (cancelled) return;
        setRaces(json.races ?? []);
        setRaceId((json.races?.[0]?.id as string) ?? "");
      } catch {
        if (!cancelled) setError("Impossible de charger la liste des courses.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRace = useMemo(
    () => races.find((r) => r.id === raceId) ?? null,
    [races, raceId],
  );

  async function onEstimate() {
    setError(null);
    setResult(null);
    if (!raceId) {
      setError("Sélectionne une course.");
      return;
    }

    const road: { distance: "10K" | "HM" | "M"; timeSeconds: number }[] = [];
    const s10 = parseHmsToSeconds(form.t10k);
    if (typeof s10 === "number") road.push({ distance: "10K", timeSeconds: s10 });
    const shm = parseHmsToSeconds(form.thm);
    if (typeof shm === "number") road.push({ distance: "HM", timeSeconds: shm });
    const sm = parseHmsToSeconds(form.tm);
    if (typeof sm === "number") road.push({ distance: "M", timeSeconds: sm });

    const trail: { name: string; timeSeconds: number }[] = [];
    const classicSeconds = parseHmsToSeconds(form.classicTime);
    const classic = TRAIL_CLASSICS.find((c) => c.id === form.classicId);
    if (classic && typeof classicSeconds === "number") {
      trail.push({
        name: classic.name,
        timeSeconds: classicSeconds,
      });
    }

    const payload = {
      raceId,
      profile: {
        utmbIndex: toNumberOrUndefined(form.utmbIndex),
        itra: toNumberOrUndefined(form.itra),
        vo2max: toNumberOrUndefined(form.vo2max),
        road,
        trail,
      },
    };

    setIsLoading(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(json?.error ?? "Erreur serveur");
      }
      setResult(json as EstimateResult);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Estimation de temps (UTMB World Series)
            </h1>
            <RaceBadge>MVP</RaceBadge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Tu renseignes ton niveau (UTMB Index/ITRA/VO2max + temps de référence),
            puis tu obtiens une estimation de temps sur une course UTMB World Series
            avec un intervalle plausible (P10–P90) et des bornes “meilleur/pire” observées
            pour un index similaire.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Profil & références</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  UTMB Index
                </span>
                <input
                  value={form.utmbIndex}
                  onChange={(e) => setForm((f) => ({ ...f, utmbIndex: e.target.value }))}
                  inputMode="decimal"
                  placeholder="ex: 500"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Cote ITRA
                </span>
                <input
                  value={form.itra}
                  onChange={(e) => setForm((f) => ({ ...f, itra: e.target.value }))}
                  inputMode="decimal"
                  placeholder="ex: 520"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  VO2max (montre)
                </span>
                <input
                  value={form.vo2max}
                  onChange={(e) => setForm((f) => ({ ...f, vo2max: e.target.value }))}
                  inputMode="decimal"
                  placeholder="ex: 52"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                />
              </label>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Temps de référence route</h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Format: <span className="font-mono">HH:MM:SS</span> (ou{" "}
                <span className="font-mono">MM:SS</span>).
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    10 km
                  </span>
                  <input
                    value={form.t10k}
                    onChange={(e) => setForm((f) => ({ ...f, t10k: e.target.value }))}
                    placeholder="ex: 00:42:30"
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Semi
                  </span>
                  <input
                    value={form.thm}
                    onChange={(e) => setForm((f) => ({ ...f, thm: e.target.value }))}
                    placeholder="ex: 01:33:00"
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Marathon
                  </span>
                  <input
                    value={form.tm}
                    onChange={(e) => setForm((f) => ({ ...f, tm: e.target.value }))}
                    placeholder="ex: 03:20:00"
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Classique trail (optionnel)</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Course
                  </span>
                  <select
                    value={form.classicId}
                    onChange={(e) => setForm((f) => ({ ...f, classicId: e.target.value }))}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  >
                    {TRAIL_CLASSICS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Temps
                  </span>
                  <input
                    value={form.classicTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, classicTime: e.target.value }))
                    }
                    placeholder="ex: 07:10:00"
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Course cible</h2>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  UTMB World Series
                </span>
                <select
                  value={raceId}
                  onChange={(e) => setRaceId(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                >
                  {races.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.eventName} — {r.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedRace && (
                <div className="flex flex-wrap gap-2">
                  <RaceBadge>{selectedRace.category}</RaceBadge>
                  <RaceBadge>
                    {selectedRace.distanceKm} km · {selectedRace.elevationGainM} m D+
                  </RaceBadge>
                  <RaceBadge>{selectedRace.region}</RaceBadge>
                </div>
              )}

              <button
                onClick={onEstimate}
                disabled={isLoading || !raceId}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {isLoading ? "Calcul..." : "Estimer mon temps"}
              </button>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              )}

              {!error && !result && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-300">
                  Astuce: si tu renseignes seulement l’UTMB Index, tu auras déjà une
                  estimation (les autres champs réduisent surtout l’incertitude).
                </div>
              )}
            </div>

            {result && (
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Résultat — index effectif:{" "}
                        <span className="font-mono">{result.effectiveUtmbIndex}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        Échantillon (MVP): {result.sampleSize} performances
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RaceBadge>P10</RaceBadge>
                      <span className="font-mono text-xs">
                        {formatSecondsToHms(result.estimate.p10Seconds)}
                      </span>
                      <RaceBadge>Médiane</RaceBadge>
                      <span className="font-mono text-xs">
                        {formatSecondsToHms(result.estimate.p50Seconds)}
                      </span>
                      <RaceBadge>P90</RaceBadge>
                      <span className="font-mono text-xs">
                        {formatSecondsToHms(result.estimate.p90Seconds)}
                      </span>
                    </div>
                  </div>

                  {(result.estimate.bestObservedSeconds ||
                    result.estimate.worstObservedSeconds) && (
                    <div className="mt-3 grid gap-2 text-xs text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">Meilleur observé (±25 index)</div>
                        <div className="mt-1 font-mono">
                          {result.estimate.bestObservedSeconds
                            ? formatSecondsToHms(result.estimate.bestObservedSeconds)
                            : "—"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">Pire observé (±25 index)</div>
                        <div className="mt-1 font-mono">
                          {result.estimate.worstObservedSeconds
                            ? formatSecondsToHms(result.estimate.worstObservedSeconds)
                            : "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {result.roadEquivalences && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
                    <div className="text-sm font-semibold">Équivalences route (indicatif)</div>
                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">VDOT</div>
                        <div className="mt-1 font-mono">{result.roadEquivalences.vdot}</div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">10 km</div>
                        <div className="mt-1 font-mono">
                          {formatSecondsToHms(result.roadEquivalences.t10kSeconds)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">Semi</div>
                        <div className="mt-1 font-mono">
                          {formatSecondsToHms(result.roadEquivalences.thmSeconds)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="font-medium">Marathon</div>
                        <div className="mt-1 font-mono">
                          {formatSecondsToHms(result.roadEquivalences.tmSeconds)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-300">
                  <div className="font-semibold">Notes</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {result.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
          MVP: la liste des courses et les “historiques” sont une base de travail.
          Prochaine étape: ingestion de résultats réels (UTMB/CSV) + concordances
          fines par course et par catégorie.
        </footer>
      </div>
    </div>
  );
}

