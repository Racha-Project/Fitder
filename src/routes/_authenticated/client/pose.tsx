import { createFileRoute } from "@tanstack/react-router";
import { Activity, Brain, CheckCircle2, Video } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { clientNav } from "@/lib/client-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/client/pose")({
  component: AITrackingPage,
});

function AITrackingPage() {
  return (
    <DashboardLayout title="AI Tracking" nav={clientNav}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white shadow-elegant">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <h2 className="font-display text-3xl font-bold">Real-time Form Feedback</h2>
              <p className="mt-2 text-white/70">
                Our AI tracking system analyzes your movement to ensure you're performing exercises correctly and safely.
              </p>
              <Button className="mt-6 bg-white text-foreground hover:bg-white/90">
                <Video className="mr-2 h-4 w-4" />
                Start AI Coach
              </Button>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent to-primary opacity-75 blur"></div>
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-sidebar p-4 shadow-2xl">
                  <Brain className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-gradient-card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <Activity className="h-5 w-5 text-primary" />
              How it works
            </h3>
            <ul className="mt-4 space-y-4">
              {[
                "Position your device to see your full body",
                "Select the exercise you want to perform",
                "Our AI tracks key joints in real-time",
                "Get instant audio and visual feedback on your form",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-border bg-gradient-card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Supported Exercises
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["Squats", "Push-ups", "Planks", "Lunges", "Deadlifts", "Shoulder Press"].map((ex) => (
                <div key={ex} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {ex}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              More exercises are being added regularly by our AI team.
            </p>
          </Card>
        </div>

        <Card className="border-border bg-card p-12 text-center">
          <Video className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-lg font-semibold">Camera Access Required</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            To use the AI Tracking feature, you'll need to grant camera permission to Fitder in your browser settings.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
