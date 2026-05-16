import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clientNav } from "@/lib/client-nav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/avatar-upload";

export const Route = createFileRoute("/_authenticated/client/profile")({
  component: ClientProfilePage,
});

function ClientProfilePage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    fitness_goal: "general_fitness",
    budget_min: "",
    budget_max: "",
    preferred_trainer_gender: "no_preference",
    latitude: "",
    longitude: "",
    avatar_url: "" as string | null,
  });

  useEffect(() => {
    if (!authLoading && role && role !== "client") {
      navigate({ to: role === "trainer" ? "/trainer" : "/admin" });
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          fitness_goal: data.fitness_goal ?? "general_fitness",
          budget_min: data.budget_min?.toString() ?? "",
          budget_max: data.budget_max?.toString() ?? "",
          preferred_trainer_gender: data.preferred_trainer_gender ?? "no_preference",
          latitude: data.latitude?.toString() ?? "",
          longitude: data.longitude?.toString() ?? "",
          avatar_url: data.avatar_url ?? null,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
      () => toast.error("Could not get your location"),
    );
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);

    if (error) toast.error(error.message);
    else setForm((prev) => ({ ...prev, avatar_url: url }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      fitness_goal: form.fitness_goal as "weight_loss" | "muscle_gain" | "body_recomposition" | "strength_training" | "general_fitness",
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      preferred_trainer_gender: form.preferred_trainer_gender as "male" | "female" | "other" | "no_preference",
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  return (
    <DashboardLayout title="Profile" nav={clientNav}>
      <div className="mx-auto max-w-2xl">
        <Card className="border-border bg-gradient-card p-8">
          <div className="flex flex-col items-center justify-center mb-8 border-b border-border/50 pb-8">
            <h2 className="font-display text-2xl font-bold">Your fitness profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">We use this to match you with the best trainers.</p>
            <div className="mt-6">
              {user && (
                <AvatarUpload
                  url={form.avatar_url}
                  uid={user.id}
                  onUpload={handleAvatarUpload}
                />
              )}
            </div>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-5">
              <Field label="Full name">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </Field>

              <Field label="Fitness goal">
                <Select value={form.fitness_goal} onValueChange={(v) => setForm({ ...form, fitness_goal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle gain</SelectItem>
                    <SelectItem value="body_recomposition">Body recomposition</SelectItem>
                    <SelectItem value="strength_training">Strength training</SelectItem>
                    <SelectItem value="general_fitness">General fitness</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Budget min ($)"><Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></Field>
                <Field label="Budget max ($)"><Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></Field>
              </div>

              <Field label="Preferred trainer gender">
                <Select value={form.preferred_trainer_gender} onValueChange={(v) => setForm({ ...form, preferred_trainer_gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_preference">No preference</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div>
                <div className="flex items-end gap-2">
                  <Field label="Latitude"><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
                  <Field label="Longitude"><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
                  <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
