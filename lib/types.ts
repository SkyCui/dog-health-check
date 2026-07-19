export type BodyCondition = "thin" | "ideal" | "slightly_fat" | "obese" | "unknown";
export type FoodType = "kibble" | "canned" | "freeze_dried" | "fresh" | "homemade" | "mixed";
export type Size = "small" | "medium" | "large" | "unknown";
export type SnackLevel = "low" | "medium" | "high";
export type OutdoorFrequency = "rare" | "once_toilet_only" | "one_to_two" | "two_to_three" | "two_plus";
export type DailyMinutes = "unknown" | "under_10" | "10_20" | "around_30" | "over_30";
export type SniffingLevel = "none" | "little" | "normal" | "rich" | "unknown";

export type RecentSignal =
  | "normal" | "unstable_poop" | "bad_breath" | "paw_licking_or_scratching"
  | "low_energy" | "appetite_change" | "vomiting" | "diarrhea" | "pain" | "mobility_issue";

export type HomeEnvironment =
  | "aromatherapy" | "strong_cleaner" | "secondhand_smoke" | "plastic_bowl"
  | "pesticide" | "none" | "unknown";

export type PositiveEngagement = "often" | "sometimes" | "rare" | "unknown";
export type RelaxationLevel = "easy" | "sometimes_difficult" | "often_difficult" | "unknown";
export type SocialConnection = "secure" | "variable" | "withdrawn" | "unknown";
export type DistressSignal =
  | "frequent_fear_or_hiding" | "separation_distress" | "persistent_pacing_or_vocalizing"
  | "repetitive_behavior" | "sudden_behavior_change" | "aggression_safety_risk"
  | "self_injury" | "none" | "unknown";

export type StatusKey = "excellent" | "good" | "watch" | "adjust" | "risk_confirm" | "red_vet" | "behavior_support";
export type SupportRoute = "none" | "vet" | "veterinary_behavior";
export type HealthDimensionKey = "body" | "diet" | "movement" | "recent" | "environment";
export type MentalDimensionKey = "positiveEngagement" | "relaxation" | "socialConnection" | "distress";

export type AssessmentInput = {
  dogName?: string;
  dogPhoto?: string;
  age: string;
  breed: string;
  weight?: string;
  size: Size;
  bodyCondition: BodyCondition;
  foodTypes: FoodType[];
  snackLevel: SnackLevel;
  movement: { outdoorFrequency: OutdoorFrequency; dailyMinutes: DailyMinutes; sniffing: SniffingLevel };
  recentSignals: RecentSignal[];
  homeEnvironment: HomeEnvironment[];
  mentalState: {
    positiveEngagement: PositiveEngagement;
    relaxation: RelaxationLevel;
    socialConnection: SocialConnection;
    distressSignals: DistressSignal[];
  };
};

export type HealthDimensionScores = Record<HealthDimensionKey, number>;
export type MentalDimensionScores = Record<MentalDimensionKey, number>;

export type SafetyBoundaryResult = {
  statusOverride: "red_vet" | "behavior_support" | null;
  supportRoute: SupportRoute;
  reason: string;
  reminder: string;
};

export type EvidenceReference = { id: string; title: string; organization: string; level: "A1" | "A2" | "B" | "C"; url: string };
export type DashboardReportSection = { id: string; title: string; body?: string; items?: string[] };
export type DashboardReport = { title: string; subtitle: string; scoreLabel: string; sections: DashboardReportSection[] };
export type ShareAction = { id: "copy_text" | "download_image" | "wechat_moments" | "xiaohongshu" | "weibo"; label: string; description: string; enabled: boolean };
export type ShareGuide = { primaryCta: string; safetyNote: string; actions: ShareAction[] };

export type GeneratedResult = {
  status: StatusKey;
  statusText: string;
  coreConclusion: string;
  happinessScore: number;
  healthScore: number;
  mentalWellbeingScore: number;
  healthDimensionScores: HealthDimensionScores;
  mentalDimensionScores: MentalDimensionScores;
  strengths: string[];
  coreRisk: { title: string; reason: string; domain: "health" | "mental" | "safety" };
  todayAction: { title: string; body: string };
  supportRoute: SupportRoute;
  supportReminder: string;
  allowShare: boolean;
  shareCopy: string;
  knowledgeVersion: string;
  evidenceRefs: EvidenceReference[];
  dashboardReport: DashboardReport;
  shareGuide: ShareGuide;
};
