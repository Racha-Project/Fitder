import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Calendar, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrainerStats } from "@/hooks/use-trainer-stats";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/trainer/")({
  component: TrainerDashboard,
});

function TrainerDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh } = useTrainerStats(user?.id);

  useEffect(() => {
    if (!loading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [loading, role, navigate]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  return (
    <DashboardLayout title="Trainer Dashboard" nav={trainerNav}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Welcome, Coach</h2>
          <p className="mt-2 text-white/70">Manage your schedule, accept bookings, and grow your client base.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-foreground hover:bg-white/90">
              <Link to="/trainer/bookings">
                <Users className="mr-2 h-4 w-4" />
                View bookings
                {stats.pendingBookings > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">{stats.pendingBookings}</Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/trainer/availability">
                <Calendar className="mr-2 h-4 w-4" />
                Set availability
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Pending requests", value: statsLoading ? "…" : String(stats.pendingBookings) },
            { label: "Upcoming sessions", value: statsLoading ? "…" : String(stats.upcomingSessions) },
            { label: "Active clients", value: statsLoading ? "…" : String(stats.activeClients) },
            {
              label: "Rating",
              value: statsLoading
                ? "…"
                : stats.rating != null
                  ? `${stats.rating.toFixed(1)} (${stats.totalReviews})`
                  : "—",
            },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-gradient-card p-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-2 font-display text-2xl font-bold sm:text-3xl">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-gradient-card p-6">
          <h3 className="font-display text-lg font-semibold">Quick links</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LinkCard to="/trainer/profile" title="Complete your profile" desc="Bio, price, specialties — clients see this when matching." />
            <LinkCard to="/trainer/earnings" title="Earnings" desc={`$${stats.completedEarnings.toFixed(0)} from completed sessions`} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function LinkCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
