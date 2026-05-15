import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trainer/profile")({
  component: TrainerProfilePage,
});

function TrainerProfilePage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    specialties: "",
    certifications: "",
    experience_years: "0",
    experience_level: "beginner",
    price_per_session: "",
    training_location: "",
    gym_name: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (!authLoading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [profileRes, trainerRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("trainer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      const p = profileRes.data;
      const t = trainerRes.data;
      setForm({
        full_name: p?.full_name ?? "",
        bio: t?.bio ?? "",
        specialties: (t?.specialties ?? []).join(", "),
        certifications: (t?.certifications ?? []).join(", "),
        experience_years: String(t?.experience_years ?? 0),
        experience_level: t?.experience_level ?? "beginner",
        price_per_session: t?.price_per_session?.toString() ?? "",
        training_location: t?.training_location ?? "",
        gym_name: t?.gym_name ?? "",
        latitude: p?.latitude?.toString() ?? "",
        longitude: p?.longitude?.toString() ?? "",
      });
      setLoading(false);
    })();
  }, [user]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        })),
      () => toast.error("Could not get your location"),
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const specialties = form.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const certifications = form.certifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      })
      .eq("id", user.id);

    if (profileErr) {
      setSaving(false);
      return toast.error(profileErr.message);
    }

    const trainerPayload = {
      user_id: user.id,
      bio: form.bio || null,
      specialties,
      certifications,
      experience_years: Number(form.experience_years) || 0,
      experience_level: form.experience_level as "beginner" | "intermediate" | "advanced" | "expert",
      price_per_session: form.price_per_session ? Number(form.price_per_session) : 0,
      training_location: form.training_location || null,
      gym_name: form.gym_name || null,
    };

    const { data: existing } = await supabase
      .from("trainer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error: trainerErr } = existing
      ? await supabase.from("trainer_profiles").update(trainerPayload).eq("user_id", user.id)
      : await supabase.from("trainer_profiles").insert(trainerPayload);

    setSaving(false);
    if (trainerErr) return toast.error(trainerErr.message);
    toast.success("Trainer profile saved");
  };

  return (
    <DashboardLayout title="Trainer Profile" nav={trainerNav}>
      <div className="mx-auto max-w-2xl">
        <Card className="border-border bg-gradient-card p-8">
          <h2 className="font-display text-2xl font-bold">Your coach profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Clients see this when matching and booking.</p>

          {loading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-5">
              <Field label="Full name">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </Field>
              <Field label="Bio">
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </Field>
              <Field label="Specialties (comma-separated)">
                <Input
                  placeholder="weight loss, strength, HIIT"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                />
              </Field>
              <Field label="Certifications (comma-separated)">
                <Input
                  placeholder="NASM CPT, ACE"
                  value={form.certifications}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Experience (years)">
                  <Input
                    type="number"
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                  />
                </Field>
                <Field label="Experience level">
                  <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner coach</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Price per session ($)">
                <Input
                  type="number"
                  value={form.price_per_session}
                  onChange={(e) => setForm({ ...form, price_per_session: e.target.value })}
                />
              </Field>
              <Field label="Training location">
                <Input
                  value={form.training_location}
                  onChange={(e) => setForm({ ...form, training_location: e.target.value })}
                />
              </Field>
              <Field label="Gym name">
                <Input value={form.gym_name} onChange={(e) => setForm({ ...form, gym_name: e.target.value })} />
              </Field>
              <div className="flex items-end gap-2">
                <Field label="Latitude">
                  <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </Field>
                <Field label="Longitude">
                  <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </Field>
                <Button type="button" variant="outline" onClick={useMyLocation}>
                  Use my location
                </Button>
              </div>
              <Button
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
              >
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
