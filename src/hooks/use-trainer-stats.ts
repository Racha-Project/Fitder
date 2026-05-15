import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrainerStats {
  pendingBookings: number;
  upcomingSessions: number;
  activeClients: number;
  rating: number | null;
  totalReviews: number;
  completedEarnings: number;
}

const emptyStats: TrainerStats = {
  pendingBookings: 0,
  upcomingSessions: 0,
  activeClients: 0,
  rating: null,
  totalReviews: 0,
  completedEarnings: 0,
};

export function useTrainerStats(trainerId: string | undefined) {
  const [stats, setStats] = useState<TrainerStats>(emptyStats);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!trainerId) return;
    setLoading(true);

    const [bookingsRes, profileRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, client_id, booking_status, total_price")
        .eq("trainer_id", trainerId),
      supabase
        .from("trainer_profiles")
        .select("rating, total_reviews")
        .eq("user_id", trainerId)
        .maybeSingle(),
    ]);

    const bookings = bookingsRes.data ?? [];
    const pending = bookings.filter((b) => b.booking_status === "pending").length;
    const upcoming = bookings.filter(
      (b) => b.booking_status === "accepted" || b.booking_status === "pending",
    ).length;
    const clientIds = new Set(bookings.map((b) => b.client_id));
    const earnings = bookings
      .filter((b) => b.booking_status === "completed")
      .reduce((sum, b) => sum + Number(b.total_price ?? 0), 0);

    setStats({
      pendingBookings: pending,
      upcomingSessions: upcoming,
      activeClients: clientIds.size,
      rating: profileRes.data?.rating != null ? Number(profileRes.data.rating) : null,
      totalReviews: profileRes.data?.total_reviews ?? 0,
      completedEarnings: earnings,
    });
    setLoading(false);
  }, [trainerId]);

  return { stats, loading, refresh };
}
