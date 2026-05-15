import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, MapPin, RefreshCw, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrainerMatches } from "@/hooks/use-trainer-matches";
import { DashboardLayout } from "@/components/dashboard-layout";
import { clientNav } from "@/lib/client-nav";
import { BADGE_LABELS } from "@/lib/matching";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/client/matches")({
  component: ClientMatchesPage,
});

function ClientMatchesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { matches, loading, error, runMatching, loadSavedMatches } = useTrainerMatches(user?.id);

  useEffect(() => {
    if (!authLoading && role && role !== "client") {
      navigate({ to: role === "trainer" ? "/trainer" : "/admin" });
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (user) void loadSavedMatches();
  }, [user, loadSavedMatches]);

  const handleFindMatches = async () => {
    const ok = await runMatching();
    if (ok) toast.success("Matches updated");
  };

  return (
    <DashboardLayout title="Your Matches" nav={clientNav}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-6 text-white shadow-elegant sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">AI trainer matching</h2>
              <p className="mt-2 max-w-lg text-sm text-white/75">
                Scores combine your goal, distance, budget, availability, specialties, and preferences.
              </p>
            </div>
            <Button
              onClick={() => void handleFindMatches()}
              disabled={loading}
              className="shrink-0 bg-white text-foreground hover:bg-white/90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {matches.length ? "Refresh matches" : "Find my trainers"}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">{error}</Card>
        )}

        {loading && matches.length === 0 && (
          <Card className="flex items-center justify-center gap-2 border-border p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Finding trainers...
          </Card>
        )}

        {!loading && matches.length === 0 && (
          <Card className="border-dashed border-border p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-display text-xl font-semibold">No matches yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Complete your profile (goal, budget, location) then click Find my trainers. You need at least one
              approved trainer in the system.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/client/profile">Complete profile</Link>
              </Button>
              <Button onClick={() => void handleFindMatches()} className="bg-gradient-primary text-primary-foreground">
                Find my trainers
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {matches.map((m, i) => (
            <Card key={m.trainerId} className="border-border bg-gradient-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                    {(m.profile.full_name ?? "T").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{m.profile.full_name ?? "Trainer"}</h3>
                      {m.badges.map((b) => (
                        <Badge key={b} variant="secondary" className="text-xs">
                          {BADGE_LABELS[b]}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {m.trainer.bio ?? "Certified personal trainer"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {m.trainer.price_per_session != null && (
                        <span>${Number(m.trainer.price_per_session).toFixed(0)}/session</span>
                      )}
                      {(m.trainer.rating ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {Number(m.trainer.rating).toFixed(1)}
                        </span>
                      )}
                      {m.distanceKm != null && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.distanceKm.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                    {m.trainer.specialties && m.trainer.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.trainer.specialties.slice(0, 4).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs font-normal">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right sm:min-w-[120px]">
                  <div className="font-display text-3xl font-bold text-primary">{m.score}%</div>
                  <p className="text-xs text-muted-foreground">compatibility</p>
                  <p className="mt-1 text-xs text-muted-foreground">#{i + 1} ranked</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ScoreBar label="Goal fit" value={m.breakdown.goal} />
                <ScoreBar label="Distance" value={m.breakdown.distance} />
                <ScoreBar label="Availability" value={m.breakdown.availability} />
                <ScoreBar label="Budget" value={m.breakdown.budget} />
                <ScoreBar label="Specialty" value={m.breakdown.specialty} />
                <ScoreBar label="Preferences" value={m.breakdown.preference} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
