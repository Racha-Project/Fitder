import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrainerStats } from "@/hooks/use-trainer-stats";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/trainer/earnings")({
  component: TrainerEarningsPage,
});

function TrainerEarningsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { stats, loading, refresh } = useTrainerStats(user?.id);

  useEffect(() => {
    if (!authLoading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  return (
    <DashboardLayout title="Earnings" nav={trainerNav}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8" />
            <div>
              <p className="text-sm text-white/70">Total from completed sessions</p>
              <p className="font-display text-4xl font-bold">
                {loading ? "…" : `$${stats.completedEarnings.toFixed(2)}`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-gradient-card p-6">
          <h3 className="font-display text-lg font-semibold">Summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Active clients</dt>
              <dd className="font-medium">{loading ? "…" : stats.activeClients}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pending bookings</dt>
              <dd className="font-medium">{loading ? "…" : stats.pendingBookings}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Your rating</dt>
              <dd className="font-medium">
                {loading ? "…" : stats.rating != null ? `${stats.rating.toFixed(1)} ★` : "No reviews yet"}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            Payouts and detailed reports can be added in a future update. Mark sessions as completed in Bookings to
            track earnings.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
