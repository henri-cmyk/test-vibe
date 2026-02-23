import { UTMB_WORLD_SERIES_RACES } from "@/data/races";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    races: UTMB_WORLD_SERIES_RACES.filter((r) => r.utmbWorldSeries),
    updatedAt: new Date().toISOString(),
    source: "local-mvp",
  });
}

