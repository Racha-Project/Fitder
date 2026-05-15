import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface BookingRow {
  id: string;
  slot_id: string;
  booking_status: BookingStatus;
  total_price: number;
  notes: string | null;
  created_at: string;
  client: { full_name: string | null; email: string | null } | null;
  slot: {
    start_time: string;
    end_time: string;
    date: string | null;
    day_of_week: number | null;
    is_recurring: boolean | null;
  } | null;
}

const STATUS_VARIANT: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  cancelled: "outline",
  completed: "outline",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Route = createFileRoute("/_authenticated/trainer/bookings")({
  component: TrainerBookingsPage,
});

function TrainerBookingsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [authLoading, role, navigate]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id, slot_id, booking_status, total_price, notes, created_at,
        client:profiles!bookings_client_id_fkey (full_name, email),
        slot:availability_slots!bookings_slot_id_fkey (start_time, end_time, date, day_of_week, is_recurring)
      `,
      )
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setBookings((data as BookingRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const updateStatus = async (booking: BookingRow, status: BookingStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: status })
      .eq("id", booking.id);
    if (error) return toast.error(error.message);

    if (status === "accepted") {
      await supabase.from("availability_slots").update({ is_booked: true }).eq("id", booking.slot_id);
    }
    if (status === "rejected" || status === "cancelled") {
      await supabase.from("availability_slots").update({ is_booked: false }).eq("id", booking.slot_id);
    }

    toast.success(`Booking ${status}`);
    void loadBookings();
  };

  const formatWhen = (b: BookingRow) => {
    const s = b.slot;
    if (!s) return "—";
    const time = `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`;
    if (s.is_recurring && s.day_of_week != null) {
      return `${DAY_NAMES[s.day_of_week]} (weekly) · ${time}`;
    }
    return `${s.date ?? "TBD"} · ${time}`;
  };

  return (
    <DashboardLayout title="Bookings" nav={trainerNav}>
      <div className="mx-auto max-w-3xl space-y-4">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading bookings...</Card>
        ) : bookings.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <h3 className="font-display text-lg font-semibold">No bookings yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">When clients book your slots, requests appear here.</p>
          </Card>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} className="border-border bg-gradient-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{b.client?.full_name ?? "Client"}</p>
                  <p className="text-sm text-muted-foreground">{b.client?.email}</p>
                  <p className="mt-2 text-sm">{formatWhen(b)}</p>
                  {b.notes && <p className="mt-1 text-sm italic text-muted-foreground">&ldquo;{b.notes}&rdquo;</p>}
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[b.booking_status]}>{b.booking_status}</Badge>
                  <p className="mt-2 font-display text-xl font-bold">${Number(b.total_price).toFixed(0)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {b.booking_status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => void updateStatus(b, "accepted")}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(b, "rejected")}>
                      Reject
                    </Button>
                  </>
                )}
                {b.booking_status === "accepted" && (
                  <Button size="sm" onClick={() => void updateStatus(b, "completed")}>
                    Mark completed
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
