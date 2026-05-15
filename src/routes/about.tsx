import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — LachaFit" },
      { name: "description", content: "How LachaFit matches clients with trainers using AI compatibility scoring." },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="font-display text-5xl font-bold tracking-tight">About LachaFit</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          LachaFit is an intelligent fitness platform that connects clients with personal trainers through smart compatibility matching, transparent booking, and AI-powered posture coaching.
        </p>
        <div className="mt-12 space-y-10">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary font-display text-xl font-bold text-primary-foreground shadow-glow">
                {i + 1}
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
            <Link to="/register">Create your account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

const steps = [
  { title: "Tell us your goals", desc: "Set your fitness goal, budget range, schedule, location and trainer preferences." },
  { title: "Get matched", desc: "Our compatibility engine scores every nearby trainer and surfaces your best fits — Best Match, Closest, Budget Friendly and Top Rated." },
  { title: "Book a session", desc: "Browse a trainer's availability calendar and lock in a time. Realtime status updates from request to confirmation." },
  { title: "Train with form", desc: "Use our AI posture coach to get real-time feedback on squats, push-ups, planks and more." },
];
