import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrainerStats } from "@/hooks/use-trainer-stats";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/trainer/earnings")({
  component: TrainerEarningsPage,
});

function TrainerEarningsPage() {
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
    <DashboardLayout title="My Earnings" nav={trainerNav}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/trainer" })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-2xl font-bold">Earnings Summary</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-gradient-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold">
              ${statsLoading ? "..." : stats.completedEarnings.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Total from completed sessions</p>
          </Card>

          <Card className="border-border bg-gradient-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Commission (10%)</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-destructive">
              -${statsLoading ? "..." : stats.totalCommission.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Platform maintenance fee</p>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Net Earnings</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-primary">
              ${statsLoading ? "..." : stats.netEarnings.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-primary/70">Your take-home pay</p>
          </Card>
        </div>

        <Card className="border-border bg-card p-8">
          <h3 className="font-display text-xl font-bold">Payout Information</h3>
          <div className="mt-6 space-y-6">
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Automatic Payouts</span>
                <Badge>Weekly</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Earnings are automatically transferred to your registered bank account every Monday.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Commission Policy</h4>
              <p className="text-sm leading-relaxed">
                Fitder charges a flat 10% commission on every completed session. This fee covers platform maintenance, AI tracking services, and marketing to bring more clients to your profile.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
