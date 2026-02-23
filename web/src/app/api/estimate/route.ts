import { estimateFinishTime } from "@/lib/estimation";
import type { ProfileInput, RoadReference, TrailClassicReference } from "@/lib/types";
import { NextResponse } from "next/server";

function asNumber(x: unknown): number | undefined {
  if (x === null || x === undefined) return undefined;
  const n = typeof x === "string" ? Number(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Body invalide" }, { status: 400 });
    }

    const raceId = typeof body.raceId === "string" ? body.raceId : null;
    if (!raceId) {
      return NextResponse.json({ error: "raceId manquant" }, { status: 400 });
    }

    const profileRaw = isRecord(body.profile) ? body.profile : {};

    const roadRaw = Array.isArray(profileRaw.road) ? profileRaw.road : [];
    const road: RoadReference[] = roadRaw
      .map((r) => {
        if (!isRecord(r)) return null;
        const distance = r.distance;
        const timeSeconds = asNumber(r.timeSeconds);
        if (
          (distance === "10K" || distance === "HM" || distance === "M") &&
          typeof timeSeconds === "number" &&
          timeSeconds > 0
        ) {
          return { distance, timeSeconds };
        }
        return null;
      })
      .filter((x): x is RoadReference => x !== null);

    const trailRaw = Array.isArray(profileRaw.trail) ? profileRaw.trail : [];
    const trail: TrailClassicReference[] = trailRaw
      .map((t) => {
        if (!isRecord(t)) return null;
        const name = typeof t.name === "string" ? t.name : "";
        const timeSeconds = asNumber(t.timeSeconds);
        if (name.trim().length > 0 && typeof timeSeconds === "number" && timeSeconds > 0) {
          return { name, timeSeconds };
        }
        return null;
      })
      .filter((x): x is TrailClassicReference => x !== null);

    const profile: ProfileInput = {
      utmbIndex: asNumber(profileRaw.utmbIndex),
      itra: asNumber(profileRaw.itra),
      vo2max: asNumber(profileRaw.vo2max),
      road,
      trail,
    };

    const result = estimateFinishTime({ raceId, profile });
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: "Requête invalide",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 400 },
    );
  }
}

