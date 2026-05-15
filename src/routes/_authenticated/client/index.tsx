import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrainerMatches } from "@/hooks/use-trainer-matches";
import { DashboardLayout } from "@/components/dashboard-layout";
import { clientNav } from "@/lib/client-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/client/")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { matches, loading: matchesLoading, loadSavedMatches } = useTrainerMatches(user?.id);

  useEffect(() => {
    if (!loading && role && role !== "client") {
      navigate({ to: role === "trainer" ? "/trainer" : "/admin" });
    }
  }, [loading, role, navigate]);

  useEffect(() => {
    if (user) void loadSavedMatches();
  }, [user, loadSavedMatches]);

  return (
    <DashboardLayout title="Client Dashboard" nav={clientNav}>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Welcome to LachaFit</h2>
          <p className="mt-2 text-white/70">Find trainers matched to your goals, budget, and location.</p>
          <Button asChild className="mt-6 bg-white text-foreground hover:bg-white/90">
            <Link to="/client/matches">
              <Sparkles className="mr-2 h-4 w-4" />
              View my matches
            </Link>
          </Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Matched trainers",
              value: matchesLoading ? "…" : String(matches.length),
              hint: matches.length ? "See ranked list" : "Run matching",
            },
            { label: "Upcoming sessions", value: "0", hint: "Book your first" },
            { label: "Pose sessions", value: "0", hint: "Try AI form coach" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-gradient-card p-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
