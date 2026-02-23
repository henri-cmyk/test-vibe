export type UtmbCategory = "20K" | "50K" | "100K" | "100M";

export type UtmbRace = {
  id: string;
  name: string;
  eventName: string;
  country: string;
  region:
    | "Europe"
    | "North America"
    | "South America"
    | "Asia"
    | "Oceania"
    | "Africa"
    | "Global";
  utmbWorldSeries: boolean;
  category: UtmbCategory;
  distanceKm: number;
  elevationGainM: number;
  website?: string;
};

export type AthletePerformance = {
  raceId: string;
  utmbIndex: number;
  finishTimeSeconds: number;
  year?: number;
  gender?: "M" | "F" | "X";
  source?: "sample" | "csv" | "scrape";
};

export type RoadReference = {
  distance: "10K" | "HM" | "M";
  timeSeconds: number;
};

export type TrailClassicReference = {
  name: string;
  timeSeconds: number;
};

export type ProfileInput = {
  utmbIndex?: number;
  itra?: number;
  vo2max?: number;
  road: RoadReference[];
  trail: TrailClassicReference[];
};

export type EstimateRequest = {
  raceId: string;
  profile: ProfileInput;
};

export type EstimateResult = {
  race: UtmbRace;
  effectiveUtmbIndex: number;
  sampleSize: number;
  estimate: {
    p10Seconds: number;
    p50Seconds: number;
    p90Seconds: number;
    bestObservedSeconds?: number;
    worstObservedSeconds?: number;
  };
  roadEquivalences?: {
    vdot: number;
    t10kSeconds: number;
    thmSeconds: number;
    tmSeconds: number;
  };
  notes: string[];
};

