import { useCallback, useEffect, useState, useMemo } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SlotRow = Database["public"]["Tables"]["availability_slots"]["Row"];

interface BookingCalendarProps {
  trainerId: string;
  trainerName: string;
  pricePerSession: number;
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7; // 07:00 to 21:00
  return `${hour.toString().padStart(2, "0")}:00`;
});

export function BookingCalendar({
  trainerId,
  trainerName,
  pricePerSession,
  clientId,
  isOpen,
  onClose,
}: BookingCalendarProps) {
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);
  const [profiles, setProfiles] = useState<{
    trainer: { full_name: string | null; avatar_url: string | null };
    client: { full_name: string | null; avatar_url: string | null };
  } | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  const dates = useMemo(() => {
    const today = startOfToday();
    const startOfWeek = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
  }, [weekOffset]);

  const loadData = useCallback(async () => {
    if (!trainerId || !clientId) return;
    setLoading(true);
    
    const [slotsRes, trainerRes, clientRes] = await Promise.all([
      supabase
        .from("availability_slots")
        .select("*")
        .eq("trainer_id", trainerId)
        .eq("is_booked", false)
        .order("date", { ascending: true }),
      supabase.from("profiles").select("full_name, avatar_url").eq("id", trainerId).maybeSingle(),
      supabase.from("profiles").select("full_name, avatar_url").eq("id", clientId).maybeSingle(),
    ]);

    if (slotsRes.error) toast.error(slotsRes.error.message);
    else setSlots(slotsRes.data ?? []);

    if (trainerRes.data && clientRes.data) {
      setProfiles({
        trainer: trainerRes.data,
        client: clientRes.data,
      });

      // Fetch avatar public URLs
      const urls: Record<string, string> = {};
      const fetchAvatar = async (path: string | null) => {
        if (!path) return;
        if (path.startsWith("http")) {
          urls[path] = path;
          return;
        }
        const { data } = await supabase.storage.from("avatars").getPublicUrl(path);
        if (data) urls[path] = data.publicUrl;
      };

      await Promise.all([
        fetchAvatar(trainerRes.data.avatar_url),
        fetchAvatar(clientRes.data.avatar_url),
      ]);
      setAvatarUrls(urls);
    }
    
    setLoading(false);
  }, [trainerId, clientId]);

  useEffect(() => {
    if (isOpen) {
      void loadData();
      setSelectedSlot(null);
    }
  }, [isOpen, loadData]);

  const handleBooking = async () => {
    if (!selectedSlot || !clientId) return;

    setSubmitting(true);
    try {
      const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
        client_id: clientId,
        trainer_id: trainerId,
        slot_id: selectedSlot.id,
        total_price: pricePerSession,
        booking_status: "pending",
      }).select("booking_status").single();

      if (bookingError) throw bookingError;

      if (booking.booking_status === "accepted") {
        toast.success("Booking confirmed automatically! See you at the session.");
      } else {
        toast.success("Booking request sent! Waiting for trainer approval.");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotAt = (date: Date, startTime: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.find((s) => !s.is_recurring && s.date === dateStr && s.start_time.startsWith(startTime));
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return "";
    return avatarUrls[path] || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Book a Session</span>
            {profiles && (
              <div className="flex items-center -space-x-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                  <AvatarImage src={getAvatarUrl(profiles.client.avatar_url)} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(profiles.client.full_name ?? "C").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-white ring-2 ring-background">
                  VS
                </div>
                <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                  <AvatarImage src={getAvatarUrl(profiles.trainer.avatar_url)} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(profiles.trainer.full_name ?? "T").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            Select an available time slot for {trainerName}. Price: ${pricePerSession}/session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 border-r text-center">Time</TableHead>
                    {dates.map((date) => (
                      <TableHead key={date.toISOString()} className="min-w-[100px] text-center">
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
                        const slot = getSlotAt(date, time);
                        const isSelected = selectedSlot?.id === slot?.id;
                        
                        return (
                          <TableCell key={date.toISOString()} className="p-1">
                            {slot ? (
                              <button
                                onClick={() => setSelectedSlot(slot)}
                                className={cn(
                                  "group relative flex h-10 w-full items-center justify-center rounded-md border transition-all duration-200",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                    : "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10",
                                )}
                              >
                                {isSelected ? (
                                  <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
                                ) : (
                                  <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                )}
                              </button>
                            ) : (
                              <div className="h-10 w-full bg-muted/20 rounded-md border border-transparent" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary/5 border border-primary/20" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary/10 border border-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-muted/20 border border-transparent" />
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={() => void handleBooking()} 
            disabled={!selectedSlot || submitting}
            className="bg-gradient-primary text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
