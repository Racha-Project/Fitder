import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type SlotRow = Database["public"]["Tables"]["availability_slots"]["Row"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const Route = createFileRoute("/_authenticated/trainer/availability")({
  component: TrainerAvailabilityPage,
});

function TrainerAvailabilityPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotType, setSlotType] = useState<"recurring" | "onetime">("recurring");
  const [form, setForm] = useState({
    day_of_week: "1",
    date: "",
    start_time: "09:00",
    end_time: "10:00",
  });

  useEffect(() => {
    if (!authLoading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [authLoading, role, navigate]);

  const loadSlots = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("trainer_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("date", { ascending: true });
    if (error) toast.error(error.message);
    else setSlots(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleAdd = async () => {
    if (!user) return;
    if (form.start_time >= form.end_time) return toast.error("End time must be after start time");
    setSaving(true);
    const { error } =
      slotType === "recurring"
        ? await supabase.from("availability_slots").insert({
            trainer_id: user.id,
            is_recurring: true,
            day_of_week: Number(form.day_of_week),
            date: null,
            start_time: form.start_time,
            end_time: form.end_time,
          })
        : await supabase.from("availability_slots").insert({
            trainer_id: user.id,
            is_recurring: false,
            day_of_week: null,
            date: form.date,
            start_time: form.start_time,
            end_time: form.end_time,
          });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Slot added");
    void loadSlots();
  };

  const handleDelete = async (slot: SlotRow) => {
    if (slot.is_booked) return toast.error("Cannot delete a booked slot");
    const { error } = await supabase.from("availability_slots").delete().eq("id", slot.id);
    if (error) return toast.error(error.message);
    toast.success("Slot removed");
    void loadSlots();
  };

  const formatSlot = (slot: SlotRow) => {
    const time = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;
    if (slot.is_recurring && slot.day_of_week != null) {
      return `${DAYS[slot.day_of_week]} (weekly) · ${time}`;
    }
    return `${slot.date ?? "One-time"} · ${time}`;
  };

  return (
    <DashboardLayout title="Availability" nav={trainerNav}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-border bg-gradient-card p-6">
          <h2 className="font-display text-xl font-bold">Add time slot</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Slot type</Label>
              <Select value={slotType} onValueChange={(v) => setSlotType(v as "recurring" | "onetime")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Weekly recurring</SelectItem>
                  <SelectItem value="onetime">One-time date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {slotType === "recurring" ? (
              <div className="space-y-2">
                <Label>Day of week</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <Button
              onClick={() => void handleAdd()}
              disabled={saving || (slotType === "onetime" && !form.date)}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {saving ? "Adding..." : "Add slot"}
            </Button>
          </div>
        </Card>

        <Card className="border-border bg-gradient-card p-6">
          <h2 className="font-display text-xl font-bold">Your slots</h2>
          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No slots yet. Add your weekly or one-time availability.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {slots.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{formatSlot(slot)}</span>
                    {slot.is_booked && <Badge variant="secondary">Booked</Badge>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={slot.is_booked ?? false}
                    onClick={() => void handleDelete(slot)}
                    aria-label="Delete slot"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
