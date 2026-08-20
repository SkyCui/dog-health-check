import type {
  AssessmentInput,
  BodyCondition,
  DailyMinutes,
  DistressSignal,
  FoodType,
  HomeEnvironment,
  OutdoorFrequency,
  PositiveEngagement,
  RecentSignal,
  RelaxationLevel,
  Size,
  SnackLevel,
  SniffingLevel,
  SocialConnection
} from "./types";

export const assessmentEnums = {
  sizes: ["small", "medium", "large", "unknown"],
  bodyConditions: ["thin", "ideal", "slightly_fat", "obese", "unknown"],
  foodTypes: ["kibble", "canned", "freeze_dried", "fresh", "homemade", "mixed"],
  snackLevels: ["low", "medium", "high"],
  outdoorFrequencies: ["rare", "once_toilet_only", "one_to_two", "two_to_three", "two_plus"],
  dailyMinutes: ["unknown", "under_10", "10_20", "around_30", "over_30"],
  sniffingLevels: ["none", "little", "normal", "rich", "unknown"],
  recentSignals: [
    "normal", "unstable_poop", "bad_breath", "paw_licking_or_scratching",
    "persistent_cough", "drinking_or_urination_change", "unexplained_weight_change",
    "low_energy", "appetite_change", "vomiting", "diarrhea", "pain", "mobility_issue",
    "breathing_difficulty", "collapse_seizure_or_fainting", "swollen_abdomen_or_unproductive_retching"
  ],
  homeEnvironments: ["aromatherapy", "strong_cleaner", "secondhand_smoke", "plastic_bowl", "pesticide", "none", "unknown"],
  positiveEngagementLevels: ["often", "sometimes", "rare", "unknown"],
  relaxationLevels: ["easy", "sometimes_difficult", "often_difficult", "unknown"],
  socialConnectionLevels: ["secure", "variable", "withdrawn", "unknown"],
  distressSignals: [
    "frequent_fear_or_hiding", "separation_distress", "persistent_pacing_or_vocalizing",
    "repetitive_behavior", "sudden_behavior_change", "aggression_safety_risk", "self_injury", "none", "unknown"
  ]
} as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnumValue<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isEnumArray<T extends readonly string[]>(value: unknown, options: T) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => isEnumValue(item, options)) && new Set(value).size === value.length;
}

function stringField(payload: Record<string, unknown>, field: string, errors: string[], required = true) {
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) errors.push(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") {
    errors.push(`${field} must be a string.`);
    return "";
  }
  const trimmed = value.trim();
  if (required && !trimmed) errors.push(`${field} cannot be empty.`);
  return trimmed;
}

export function parseAssessmentInput(payload: unknown): { input?: AssessmentInput; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(payload)) return { errors: ["Request body must be a JSON object."] };

  const dogName = stringField(payload, "dogName", errors, false);
  const age = stringField(payload, "age", errors);
  const breed = stringField(payload, "breed", errors);
  const weight = stringField(payload, "weight", errors, false);

  if (!isEnumValue(payload.size, assessmentEnums.sizes)) errors.push("size is invalid.");
  if (!isEnumValue(payload.bodyCondition, assessmentEnums.bodyConditions)) errors.push("bodyCondition is invalid.");
  if (!isEnumArray(payload.foodTypes, assessmentEnums.foodTypes)) errors.push("foodTypes must be a non-empty array of unique valid values.");
  if (!isEnumValue(payload.snackLevel, assessmentEnums.snackLevels)) errors.push("snackLevel is invalid.");

  const movement = payload.movement;
  if (!isRecord(movement)) errors.push("movement is required and must be an object.");
  else {
    if (!isEnumValue(movement.outdoorFrequency, assessmentEnums.outdoorFrequencies)) errors.push("movement.outdoorFrequency is invalid.");
    if (!isEnumValue(movement.dailyMinutes, assessmentEnums.dailyMinutes)) errors.push("movement.dailyMinutes is invalid.");
    if (!isEnumValue(movement.sniffing, assessmentEnums.sniffingLevels)) errors.push("movement.sniffing is invalid.");
  }

  if (!isEnumArray(payload.recentSignals, assessmentEnums.recentSignals)) errors.push("recentSignals must be a non-empty array of unique valid values.");
  if (!isEnumArray(payload.homeEnvironment, assessmentEnums.homeEnvironments)) errors.push("homeEnvironment must be a non-empty array of unique valid values.");
  const recent = payload.recentSignals as RecentSignal[] | undefined;
  const home = payload.homeEnvironment as HomeEnvironment[] | undefined;
  if (recent?.includes("normal") && recent.length > 1) errors.push("recentSignals cannot combine normal with other signals.");
  if (home?.includes("none") && home.length > 1) errors.push("homeEnvironment cannot combine none with other values.");
  if (home?.includes("unknown") && home.length > 1) errors.push("homeEnvironment cannot combine unknown with other values.");

  const mental = payload.mentalState;
  if (!isRecord(mental)) errors.push("mentalState is required and must be an object.");
  else {
    if (!isEnumValue(mental.positiveEngagement, assessmentEnums.positiveEngagementLevels)) errors.push("mentalState.positiveEngagement is invalid.");
    if (!isEnumValue(mental.relaxation, assessmentEnums.relaxationLevels)) errors.push("mentalState.relaxation is invalid.");
    if (!isEnumValue(mental.socialConnection, assessmentEnums.socialConnectionLevels)) errors.push("mentalState.socialConnection is invalid.");
    if (!isEnumArray(mental.distressSignals, assessmentEnums.distressSignals)) errors.push("mentalState.distressSignals must be a non-empty array of unique valid values.");
    const distress = mental.distressSignals as DistressSignal[] | undefined;
    if (distress?.includes("none") && distress.length > 1) errors.push("mentalState.distressSignals cannot combine none with other values.");
    if (distress?.includes("unknown") && distress.length > 1) errors.push("mentalState.distressSignals cannot combine unknown with other values.");
  }

  if (errors.length || !isRecord(movement) || !isRecord(mental)) return { errors };
  return {
    errors,
    input: {
      dogName, age, breed, weight,
      size: payload.size as Size,
      bodyCondition: payload.bodyCondition as BodyCondition,
      foodTypes: payload.foodTypes as FoodType[],
      snackLevel: payload.snackLevel as SnackLevel,
      movement: {
        outdoorFrequency: movement.outdoorFrequency as OutdoorFrequency,
        dailyMinutes: movement.dailyMinutes as DailyMinutes,
        sniffing: movement.sniffing as SniffingLevel
      },
      recentSignals: payload.recentSignals as RecentSignal[],
      homeEnvironment: payload.homeEnvironment as HomeEnvironment[],
      mentalState: {
        positiveEngagement: mental.positiveEngagement as PositiveEngagement,
        relaxation: mental.relaxation as RelaxationLevel,
        socialConnection: mental.socialConnection as SocialConnection,
        distressSignals: mental.distressSignals as DistressSignal[]
      }
    }
  };
}
