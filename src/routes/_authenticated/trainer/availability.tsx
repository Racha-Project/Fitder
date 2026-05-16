import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Trash2, Calendar as CalendarIcon, Clock, Check, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfToday, parse, isSameDay } from "date-fns";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SlotRow = Database["public"]["Tables"]["availability_slots"]["Row"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7; // 07:00 to 21:00
  return `${hour.toString().padStart(2, "0")}:00`;
});

export const Route = createFileRoute("/_authenticated/trainer/availability")({
  component: TrainerAvailabilityPage,
});

function TrainerAvailabilityPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [weekOffset, setWeekOffset] = useState(0);

  const dates = useMemo(() => {
    const today = startOfToday();
    const startOfWeek = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
  }, [weekOffset]);

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

  const toggleSlot = async (date: Date, startTime: string) => {
    if (!user || saving) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const endTime = `${(parseInt(startTime.split(":")[0]) + 1).toString().padStart(2, "0")}:00`;

    const existingSlot = slots.find(
      (s) => !s.is_recurring && s.date === dateStr && s.start_time.startsWith(startTime),
    );

    setSaving(true);
    if (existingSlot) {
      if (existingSlot.is_booked) {
        toast.error("Cannot remove a booked slot");
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("availability_slots").delete().eq("id", existingSlot.id);
      if (error) toast.error(error.message);
      else {
        setSlots((prev) => prev.filter((s) => s.id !== existingSlot.id));
        toast.success("Slot removed");
      }
    } else {
      const { data, error } = await supabase
        .from("availability_slots")
        .insert({
          trainer_id: user.id,
          is_recurring: false,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
        })
        .select()
        .single();

      if (error) toast.error(error.message);
      else {
        setSlots((prev) => [...prev, data]);
        toast.success("Slot added");
      }
    }
    setSaving(false);
  };

  const isSlotSelected = (date: Date, startTime: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.some((s) => !s.is_recurring && s.date === dateStr && s.start_time.startsWith(startTime));
  };

  const isSlotBooked = (date: Date, startTime: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.some(
      (s) => !s.is_recurring && s.date === dateStr && s.start_time.startsWith(startTime) && s.is_booked,
    );
  };

  return (
    <DashboardLayout title="Availability" nav={trainerNav}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Manage Your Schedule</h2>
            <p className="text-muted-foreground">Select the dates and times you are available for training.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
              className={cn(view === "grid" && "bg-gradient-primary")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Grid View
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              className={cn(view === "list" && "bg-gradient-primary")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              List View
            </Button>
          </div>
        </div>

        {view === "grid" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  disabled={weekOffset <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[150px] text-center">
                  {format(dates[0], "MMM d")} – {format(dates[6], "MMM d, yyyy")}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
              >
                Today
              </Button>
            </div>

            <Card className="border-border bg-gradient-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 border-r text-center">Time</TableHead>
                    {dates.map((date) => (
                      <TableHead key={date.toISOString()} className="min-w-[120px] text-center">
                        <div className="font-bold">{format(date, "EEE")}</div>
                        <div className="text-xs text-muted-foreground">{format(date, "MMM d")}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIME_SLOTS.map((time) => (
                    <TableRow key={time}>
                      <TableCell className="border-r py-2 text-center text-xs font-medium">
                        {time}
                      </TableCell>
                      {dates.map((date) => {
                        const selected = isSlotSelected(date, time);
                        const booked = isSlotBooked(date, time);
                        return (
                          <TableCell key={date.toISOString()} className="p-1">
                            <button
                              disabled={booked || saving}
                              onClick={() => void toggleSlot(date, time)}
                              className={cn(
                                "group relative flex h-12 w-full items-center justify-center rounded-md border transition-all duration-200",
                                selected
                                  ? booked
                                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600"
                                    : "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                  : "border-transparent bg-muted/30 hover:border-primary/30 hover:bg-primary/5",
                                booked && "cursor-not-allowed opacity-80",
                              )}
                            >
                              {selected ? (
                                booked ? (
                                  <div className="flex flex-col items-center">
                                    <Check className="h-4 w-4" />
                                    <span className="text-[10px] font-bold">Booked</span>
                                  </div>
                                ) : (
                                  <Check className="h-5 w-5 animate-in zoom-in-50 duration-200" />
                                )
                              ) : (
                                <Plus className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                              )}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t bg-muted/20 p-4">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-muted/30 border border-transparent" />
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary/10 border border-primary" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-amber-500/10 border border-amber-500/50" />
                  <span>Booked (Cannot change)</span>
                </div>
              </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-border bg-gradient-card p-6">
              <h2 className="font-display text-xl font-bold">Active Slots</h2>
              {loading ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
              ) : slots.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No slots yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {slots.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {slot.is_recurring
                            ? `${DAYS[slot.day_of_week ?? 0]} (weekly)`
                            : slot.date}{" "}
                          · {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </span>
                        {slot.is_booked && <Badge variant="secondary">Booked</Badge>}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={slot.is_booked ?? false}
                        onClick={async () => {
                          const { error } = await supabase
                            .from("availability_slots")
                            .delete()
                            .eq("id", slot.id);
                          if (error) toast.error(error.message);
                          else {
                            void loadSlots();
                            toast.success("Slot removed");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

