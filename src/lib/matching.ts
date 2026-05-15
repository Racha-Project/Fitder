import type { Database } from "@/integrations/supabase/types";

type FitnessGoal = Database["public"]["Enums"]["fitness_goal"];
type GenderType = Database["public"]["Enums"]["gender_type"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

export interface ClientMatchInput {
  fitness_goal: FitnessGoal | null;
  budget_min: number | null;
  budget_max: number | null;
  latitude: number | null;
  longitude: number | null;
  preferred_trainer_gender: GenderType | null;
  preferred_experience_level: ExperienceLevel | null;
  available_times: unknown;
}

export interface TrainerMatchInput {
  user_id: string;
  price_per_session: number | null;
  rating: number | null;
  experience_level: ExperienceLevel | null;
  specialties: string[] | null;
  profile: {
    gender: GenderType | null;
    latitude: number | null;
    longitude: number | null;
  };
  slots: {
    day_of_week: number | null;
    date: string | null;
    is_booked: boolean | null;
  }[];
}

export interface MatchBreakdown {
  goal: number;
  distance: number;
  availability: number;
  budget: number;
  specialty: number;
  preference: number;
}

export interface ScoredMatch {
  trainerId: string;
  score: number;
  distanceKm: number | null;
  breakdown: MatchBreakdown;
}

const GOAL_KEYWORDS: Record<FitnessGoal, string[]> = {
  weight_loss: ["weight", "loss", "fat", "cardio", "lean"],
  muscle_gain: ["muscle", "hypertrophy", "mass", "bodybuilding", "gain"],
  body_recomposition: ["recomp", "body", "composition", "toning"],
  strength_training: ["strength", "powerlifting", "lifting", "strong"],
  general_fitness: ["fitness", "general", "wellness", "health", "functional"],
};

const WEIGHTS = {
  goal: 0.3,
  distance: 0.2,
  availability: 0.2,
  budget: 0.15,
  specialty: 0.1,
  preference: 0.05,
} as const;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreGoal(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  if (!client.fitness_goal) return 50;
  const keywords = GOAL_KEYWORDS[client.fitness_goal];
  const specs = (trainer.specialties ?? []).map((s) => s.toLowerCase());
  if (specs.length === 0) return 40;
  const hits = keywords.filter((kw) => specs.some((s) => s.includes(kw)));
  if (hits.length >= 2) return 100;
  if (hits.length === 1) return 75;
  return 25;
}

function scoreDistance(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  const { latitude: lat1, longitude: lon1 } = client;
  const { latitude: lat2, longitude: lon2 } = trainer.profile;
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 50;
  const km = haversineKm(lat1, lon1, lat2, lon2);
  if (km <= 2) return 100;
  if (km <= 5) return 85;
  if (km <= 10) return 70;
  if (km <= 20) return 50;
  if (km <= 40) return 30;
  return 10;
}

function parseAvailableDays(availableTimes: unknown): number[] {
  if (!Array.isArray(availableTimes)) return [];
  const days: number[] = [];
  for (const entry of availableTimes) {
    if (entry && typeof entry === "object") {
      const day = (entry as { day?: number; day_of_week?: number }).day_of_week ??
        (entry as { day?: number }).day;
      if (typeof day === "number" && day >= 0 && day <= 6) days.push(day);
    }
  }
  return [...new Set(days)];
}

function scoreAvailability(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  const clientDays = parseAvailableDays(client.available_times);
  const openSlots = trainer.slots.filter((s) => !s.is_booked);
  if (openSlots.length === 0) return 20;
  if (clientDays.length === 0) return Math.min(100, 50 + openSlots.length * 5);

  const trainerDays = new Set(
    openSlots
      .map((s) => s.day_of_week)
      .filter((d): d is number => d != null && d >= 0 && d <= 6),
  );
  const overlap = clientDays.filter((d) => trainerDays.has(d)).length;
  if (overlap === 0) return 30;
  return Math.min(100, 40 + (overlap / clientDays.length) * 60);
}

function scoreBudget(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  const price = trainer.price_per_session ?? 0;
  if (price <= 0) return 50;
  const min = client.budget_min;
  const max = client.budget_max;
  if (min == null && max == null) return 60;
  const lo = min ?? 0;
  const hi = max ?? min ?? price;
  if (price >= lo && price <= hi) return 100;
  if (price < lo) {
    const gap = lo - price;
    return Math.max(40, 100 - gap * 2);
  }
  const over = price - hi;
  if (over <= 10) return 70;
  if (over <= 25) return 45;
  return 15;
}

function scoreSpecialty(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  return scoreGoal(client, trainer);
}

const EXP_RANK: Record<ExperienceLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

function scorePreference(client: ClientMatchInput, trainer: TrainerMatchInput): number {
  let score = 100;
  const prefGender = client.preferred_trainer_gender;
  const trainerGender = trainer.profile.gender;
  if (prefGender && prefGender !== "no_preference" && trainerGender) {
    score = prefGender === trainerGender ? 100 : 35;
  }
  const prefExp = client.preferred_experience_level;
  const trainerExp = trainer.experience_level;
  if (prefExp && trainerExp) {
    const diff = EXP_RANK[trainerExp] - EXP_RANK[prefExp];
    if (diff < 0) score = Math.min(score, 55);
    else if (diff === 0) score = Math.min(100, score);
    else if (diff === 1) score = Math.min(score, 85);
    else score = Math.min(score, 70);
  }
  return score;
}

export function computeMatchScore(
  client: ClientMatchInput,
  trainer: TrainerMatchInput,
): { score: number; breakdown: MatchBreakdown; distanceKm: number | null } {
  const breakdown: MatchBreakdown = {
    goal: scoreGoal(client, trainer),
    distance: scoreDistance(client, trainer),
    availability: scoreAvailability(client, trainer),
    budget: scoreBudget(client, trainer),
    specialty: scoreSpecialty(client, trainer),
    preference: scorePreference(client, trainer),
  };

  const score =
    breakdown.goal * WEIGHTS.goal +
    breakdown.distance * WEIGHTS.distance +
    breakdown.availability * WEIGHTS.availability +
    breakdown.budget * WEIGHTS.budget +
    breakdown.specialty * WEIGHTS.specialty +
    breakdown.preference * WEIGHTS.preference;

  let distanceKm: number | null = null;
  if (
    client.latitude != null &&
    client.longitude != null &&
    trainer.profile.latitude != null &&
    trainer.profile.longitude != null
  ) {
    distanceKm = haversineKm(
      client.latitude,
      client.longitude,
      trainer.profile.latitude,
      trainer.profile.longitude,
    );
  }

  return { score: Math.round(score * 10) / 10, breakdown, distanceKm };
}

export type MatchBadge = "best_match" | "closest" | "budget_friendly" | "top_rated";

export function assignBadges(matches: ScoredMatch[]): Map<string, MatchBadge[]> {
  const badges = new Map<string, MatchBadge[]>();
  if (matches.length === 0) return badges;

  const add = (trainerId: string, badge: MatchBadge) => {
    const list = badges.get(trainerId) ?? [];
    if (!list.includes(badge)) list.push(badge);
    badges.set(trainerId, list);
  };

  const sorted = [...matches].sort((a, b) => b.score - a.score);
  add(sorted[0]!.trainerId, "best_match");

  const withDist = matches.filter((m) => m.distanceKm != null);
  if (withDist.length > 0) {
    const closest = withDist.reduce((a, b) => (a.distanceKm! < b.distanceKm! ? a : b));
    add(closest.trainerId, "closest");
  }

  return badges;
}

export const BADGE_LABELS: Record<MatchBadge, string> = {
  best_match: "Best Match",
  closest: "Closest",
  budget_friendly: "Budget Friendly",
  top_rated: "Top Rated",
};
