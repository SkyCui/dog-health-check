export type BodyCondition = "thin" | "ideal" | "slightly_fat" | "obese" | "unknown";

export type FoodType = "kibble" | "canned" | "freeze_dried" | "fresh" | "homemade" | "mixed";

export type Size = "small" | "medium" | "large" | "unknown";

export type SnackLevel = "low" | "medium" | "high";

export type OutdoorFrequency = "rare" | "once_toilet_only" | "one_to_two" | "two_to_three" | "two_plus";

export type DailyMinutes = "unknown" | "under_10" | "10_20" | "around_30" | "over_30";

export type SniffingLevel = "none" | "little" | "normal" | "rich" | "unknown";

export type RecentSignal =
  | "normal"
  | "unstable_poop"
  | "bad_breath"
  | "paw_licking_or_scratching"
  | "low_energy"
  | "appetite_change"
  | "vomiting"
  | "diarrhea"
  | "pain"
  | "mobility_issue";

export type HomeEnvironment =
  | "aromatherapy"
  | "strong_cleaner"
  | "secondhand_smoke"
  | "plastic_bowl"
  | "pesticide"
  | "none"
  | "unknown";

export type StatusKey = "excellent" | "good" | "watch" | "adjust" | "risk_confirm" | "red_vet";

export type DimensionKey = "body" | "diet" | "movement" | "recent" | "environment";

export type AssessmentInput = {
  dogName?: string;
  age: string;
  breed: string;
  weight?: string;
  size: Size;
  bodyCondition: BodyCondition;
  foodTypes: FoodType[];
  snackLevel: SnackLevel;
  movement: {
    outdoorFrequency: OutdoorFrequency;
    dailyMinutes: DailyMinutes;
    sniffing: SniffingLevel;
  };
  recentSignals: RecentSignal[];
  homeEnvironment: HomeEnvironment[];
};

export type DimensionScores = Record<DimensionKey, number>;

export type VetBoundaryResult = {
  triggered: boolean;
  reason: string;
  reminder: string;
};

export type GeneratedResult = {
  status: StatusKey;
  statusText: string;
  coreConclusion: string;
  longevityScore: number;
  dimensionScores: DimensionScores;
  strengths: string[];
  coreRisk: {
    title: string;
    reason: string;
  };
  todayAction: {
    title: string;
    body: string;
  };
  vetReminder: string;
  allowShare: boolean;
  shareCopy: string;
};
