import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, Calendar, MapPin, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "LachaFit — Smart Fitness Trainer Matching" },
      { name: "description", content: "AI-powered platform connecting you with the perfect personal trainer based on your goals, budget, location, and schedule." },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>AI-powered trainer matching</span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Find your perfect <span className="text-gradient">personal trainer</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
              LachaFit matches you with certified trainers based on your goals, budget, schedule and location — then nails your form with real-time AI posture coaching.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <Link to="/register">Get matched free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/about">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight">Built for serious results</h2>
          <p className="mt-4 text-lg text-muted-foreground">Everything you need to train smarter, from discovery to form.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group relative overflow-hidden border-border bg-gradient-card p-8 transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center text-white shadow-elegant sm:p-16">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Ready to train with intent?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">Join LachaFit as a client and get your top-matched trainers, or sign up as a trainer to grow your practice.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
              <Link to="/register">Join as client</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/register">Become a trainer</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LachaFit. Train smart.
      </footer>
    </div>
  );
}

const features = [
  { icon: Sparkles, title: "AI matching", desc: "Compatibility scores rank trainers by your goal, schedule, budget, and distance." },
  { icon: MapPin, title: "Nearby trainers", desc: "Find certified pros in your neighborhood, sorted by proximity." },
  { icon: Calendar, title: "Smart booking", desc: "Browse trainer availability and book sessions in seconds — no double booking." },
  { icon: Brain, title: "AI posture coach", desc: "Get real-time form feedback on squats, push-ups, planks and more." },
  { icon: Target, title: "Goal-aligned", desc: "Weight loss, muscle gain, strength — trainers matched to what you actually want." },
  { icon: Activity, title: "Track progress", desc: "Session history, accuracy scores, and trainer feedback all in one place." },
];
