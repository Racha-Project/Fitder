import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  assignBadges,
  computeMatchScore,
  type ClientMatchInput,
  type MatchBadge,
  type MatchBreakdown,
  type TrainerMatchInput,
} from "@/lib/matching";

type TrainerRow = Database["public"]["Tables"]["trainer_profiles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface TrainerMatchCard {
  trainerId: string;
  score: number;
  distanceKm: number | null;
  breakdown: MatchBreakdown;
  badges: MatchBadge[];
  trainer: TrainerRow;
  profile: Pick<ProfileRow, "full_name" | "avatar_url" | "gender" | "latitude" | "longitude">;
}

export function useTrainerMatches(clientId: string | undefined) {
  const [matches, setMatches] = useState<TrainerMatchCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMatching = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false;
    setLoading(true);
    setError(null);

    const { data: clientProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    if (profileErr || !clientProfile) {
      setError(profileErr?.message ?? "Could not load your profile");
      setLoading(false);
      return false;
    }

    const { data: trainers, error: trainersErr } = await supabase
      .from("trainer_profiles")
      .select(
        `
        *,
        profile:profiles!trainer_profiles_user_id_fkey (
          full_name, avatar_url, gender, latitude, longitude
        )
      `,
      )
      .eq("is_approved", true);

    if (trainersErr) {
      setError(trainersErr.message);
      setLoading(false);
      return false;
    }

    const trainerList = trainers ?? [];
    const trainerIds = trainerList.map((t) => t.user_id);

    let slotsByTrainer: Record<string, TrainerMatchInput["slots"]> = {};
    if (trainerIds.length > 0) {
      const { data: slots } = await supabase
        .from("availability_slots")
        .select("trainer_id, day_of_week, date, is_booked")
        .in("trainer_id", trainerIds);
      slotsByTrainer = (slots ?? []).reduce<Record<string, TrainerMatchInput["slots"]>>((acc, s) => {
        const list = acc[s.trainer_id] ?? [];
        list.push({
          day_of_week: s.day_of_week,
          date: s.date,
          is_booked: s.is_booked,
        });
        acc[s.trainer_id] = list;
        return acc;
      }, {});
    }

    const clientInput: ClientMatchInput = {
      fitness_goal: clientProfile.fitness_goal,
      budget_min: clientProfile.budget_min,
      budget_max: clientProfile.budget_max,
      latitude: clientProfile.latitude,
      longitude: clientProfile.longitude,
      preferred_trainer_gender: clientProfile.preferred_trainer_gender,
      preferred_experience_level: clientProfile.preferred_experience_level,
      available_times: clientProfile.available_times,
    };

    const scored = trainerList.map((row) => {
      const profile = row.profile as ProfileRow | null;
      const trainerInput: TrainerMatchInput = {
        user_id: row.user_id,
        price_per_session: row.price_per_session,
        rating: row.rating,
        experience_level: row.experience_level,
        specialties: row.specialties,
        profile: {
          gender: profile?.gender ?? null,
          latitude: profile?.latitude ?? null,
          longitude: profile?.longitude ?? null,
        },
        slots: slotsByTrainer[row.user_id] ?? [],
      };
      const { score, breakdown, distanceKm } = computeMatchScore(clientInput, trainerInput);
      return {
        trainerId: row.user_id,
        score,
        distanceKm,
        breakdown,
        trainer: row,
        profile: {
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          gender: profile?.gender ?? null,
          latitude: profile?.latitude ?? null,
          longitude: profile?.longitude ?? null,
        },
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const badgeMap = assignBadges(scored);
    const prices = scored.map((s) => s.trainer.price_per_session ?? 0).filter((p) => p > 0);
    const budgetMax = clientProfile.budget_max;
    if (budgetMax != null && prices.length > 0) {
      const affordable = scored.filter(
        (s) => (s.trainer.price_per_session ?? 0) <= budgetMax && (s.trainer.price_per_session ?? 0) > 0,
      );
      if (affordable.length > 0) {
        const cheapest = affordable.reduce((a, b) =>
          (a.trainer.price_per_session ?? 0) < (b.trainer.price_per_session ?? 0) ? a : b,
        );
        const list = badgeMap.get(cheapest.trainerId) ?? [];
        if (!list.includes("budget_friendly")) list.push("budget_friendly");
        badgeMap.set(cheapest.trainerId, list);
      }
    }

    const rated = scored.filter((s) => (s.trainer.rating ?? 0) > 0);
    if (rated.length > 0) {
      const top = rated.reduce((a, b) => ((a.trainer.rating ?? 0) > (b.trainer.rating ?? 0) ? a : b));
      const list = badgeMap.get(top.trainerId) ?? [];
      if (!list.includes("top_rated")) list.push("top_rated");
      badgeMap.set(top.trainerId, list);
    }

    const cards: TrainerMatchCard[] = scored.map((s) => ({
      ...s,
      badges: badgeMap.get(s.trainerId) ?? [],
    }));

    const rows = cards.map((c) => ({
      client_id: clientId,
      trainer_id: c.trainerId,
      match_score: c.score,
      match_reason: c.breakdown as unknown as Database["public"]["Tables"]["trainer_matches"]["Insert"]["match_reason"],
    }));

    if (rows.length > 0) {
      await supabase.from("trainer_matches").upsert(rows, { onConflict: "client_id,trainer_id" });
    }

    setMatches(cards);
    setLoading(false);
    return true;
  }, [clientId]);

  const loadSavedMatches = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    const { data: saved, error: savedErr } = await supabase
      .from("trainer_matches")
      .select("trainer_id, match_score, match_reason")
      .eq("client_id", clientId)
      .order("match_score", { ascending: false });

    if (savedErr) {
      setError(savedErr.message);
      setLoading(false);
      return;
    }

    if (!saved?.length) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const ids = saved.map((s) => s.trainer_id);
    const { data: trainers } = await supabase
      .from("trainer_profiles")
      .select(
        `*, profile:profiles!trainer_profiles_user_id_fkey (full_name, avatar_url, gender, latitude, longitude)`,
      )
      .in("user_id", ids);

    const byId = new Map((trainers ?? []).map((t) => [t.user_id, t]));
    const cards: TrainerMatchCard[] = [];
    for (const s of saved) {
      const row = byId.get(s.trainer_id);
      if (!row) continue;
      const profile = row.profile as ProfileRow | null;
      cards.push({
        trainerId: s.trainer_id,
        score: s.match_score,
        distanceKm: null,
        breakdown: (s.match_reason as MatchBreakdown | null) ?? {
          goal: 0,
          distance: 0,
          availability: 0,
          budget: 0,
          specialty: 0,
          preference: 0,
        },
        badges: [],
        trainer: row,
        profile: {
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          gender: profile?.gender ?? null,
          latitude: profile?.latitude ?? null,
          longitude: profile?.longitude ?? null,
        },
      });
    }

    const badgeMap = assignBadges(cards);
    setMatches(cards.map((c) => ({ ...c, badges: badgeMap.get(c.trainerId) ?? [] })));
    setLoading(false);
  }, [clientId]);

  return { matches, loading, error, runMatching, loadSavedMatches };
}
