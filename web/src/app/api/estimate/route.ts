import { estimateFinishTime } from "@/lib/estimation";
import { NextResponse } from "next/server";

function asNumber(x: unknown): number | undefined {
  if (x === null || x === undefined) return undefined;
  const n = typeof x === "string" ? Number(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const raceId = typeof body?.raceId === "string" ? body.raceId : null;
    if (!raceId) {
      return NextResponse.json({ error: "raceId manquant" }, { status: 400 });
    }

    const profileRaw = body?.profile ?? {};

    const profile = {
      utmbIndex: asNumber(profileRaw?.utmbIndex),
      itra: asNumber(profileRaw?.itra),
      vo2max: asNumber(profileRaw?.vo2max),
      road: Array.isArray(profileRaw?.road)
        ? profileRaw.road
            .map((r: any) => ({
              distance: r?.distance,
              timeSeconds: asNumber(r?.timeSeconds),
            }))
            .filter(
              (r: any) =>
                (r.distance === "10K" || r.distance === "HM" || r.distance === "M") &&
                typeof r.timeSeconds === "number" &&
                r.timeSeconds > 0,
            )
        : [],
      trail: Array.isArray(profileRaw?.trail)
        ? profileRaw.trail
            .map((t: any) => ({
              name: typeof t?.name === "string" ? t.name : "",
              timeSeconds: asNumber(t?.timeSeconds),
            }))
            .filter(
              (t: any) =>
                typeof t.name === "string" &&
                t.name.trim().length > 0 &&
                typeof t.timeSeconds === "number" &&
                t.timeSeconds > 0,
            )
        : [],
    };

    const result = estimateFinishTime({ raceId, profile });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Requête invalide", details: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}

