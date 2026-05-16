import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DashboardLayout } from "@/components/dashboard-layout";
import { clientNav } from "@/lib/client-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, XCircle, Star } from "lucide-react";
import { ReviewDialog } from "@/components/review-dialog";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface BookingRow {
  id: string;
  slot_id: string;
  booking_status: BookingStatus;
  total_price: number;
  notes: string | null;
  created_at: string;
  trainer_id: string;
  trainer: { 
    full_name: string | null; 
    email: string | null; 
    avatar_url: string | null; 
  } | null;
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

export const Route = createFileRoute("/_authenticated/client/bookings")({
  component: ClientBookingsPage,
});

function ClientBookingsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && role && role !== "client") {
      navigate({ to: role === "trainer" ? "/trainer" : "/admin" });
    }
  }, [authLoading, role, navigate]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id, slot_id, booking_status, total_price, notes, created_at, trainer_id,
        trainer:profiles!bookings_trainer_id_fkey (full_name, email, avatar_url),
        slot:availability_slots!bookings_slot_id_fkey (start_time, end_time, date, day_of_week, is_recurring),
        reviews (id, rating, comment)
      `,
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else {
      const rows = data ?? [];
      setBookings(rows);

      // Fetch avatar public URLs
      const urls: Record<string, string> = {};
      const paths = rows
        .map((b: any) => b.trainer?.avatar_url)
        .filter((p): p is string => !!p && !p.startsWith("http"));
      
      await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage.from("avatars").getPublicUrl(path);
          if (data) urls[path] = data.publicUrl;
        })
      );
      setAvatarUrls(urls);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleCancel = async (bookingId: string, slotId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancellingId(bookingId);
    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      toast.success("Booking cancelled successfully");
      void loadBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const formatWhen = (b: any) => {
    const s = b.slot;
    if (!s) return "—";
    const time = `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`;
    if (s.is_recurring && s.day_of_week != null) {
      return `${DAY_NAMES[s.day_of_week]} (weekly) · ${time}`;
    }
    return `${s.date ?? "TBD"} · ${time}`;
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return avatarUrls[path] || "";
  };

  return (
    <DashboardLayout title="My Bookings" nav={clientNav}>
      <div className="mx-auto max-w-4xl space-y-4">
        {loading ? (
          <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your bookings...</p>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="border-dashed border-border p-12 text-center">
            <XCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">No bookings found</h3>
            <p className="mt-2 text-sm text-muted-foreground">You haven't booked any sessions yet. Find a trainer to get started!</p>
            <Button asChild className="mt-6 bg-gradient-primary">
              <a href="/client/matches">Find a trainer</a>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <Card key={b.id} className="overflow-hidden border-border bg-gradient-card">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-xl border-2 border-primary/10">
                        <AvatarImage src={getAvatarUrl(b.trainer?.avatar_url || null)} />
                        <AvatarFallback className="bg-gradient-primary text-lg font-bold text-white">
                          {(b.trainer?.full_name ?? "T").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-display text-lg font-bold">{b.trainer?.full_name ?? "Trainer"}</h3>
                        <p className="text-sm text-muted-foreground">{b.trainer?.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <Badge variant={STATUS_VARIANT[b.booking_status as BookingStatus]} className="capitalize">
                            {b.booking_status}
                          </Badge>
                          <span className="text-sm font-medium">{formatWhen(b)}</span>
                        </div>
                        {b.notes && (
                          <p className="mt-3 text-sm italic text-muted-foreground bg-muted/30 p-2 rounded">
                            &ldquo;{b.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between border-t border-border bg-muted/20 p-6 sm:w-48 sm:border-l sm:border-t-0 sm:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Price</p>
                      <p className="font-display text-2xl font-bold text-primary">${Number(b.total_price).toFixed(0)}</p>
                    </div>
                    {(b.booking_status === "pending" || b.booking_status === "accepted") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-4 w-full"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancel(b.id, b.slot_id)}
                      >
                        {cancellingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel Booking"
                        )}
                      </Button>
                    )}
                    {b.booking_status === "completed" && (!b.reviews || b.reviews.length === 0) && (
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-4 w-full bg-gradient-primary"
                        onClick={() => setReviewingBooking(b)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Review Session
                      </Button>
                    )}
                    {b.booking_status === "completed" && b.reviews && b.reviews.length > 0 && (
                      <div className="mt-4 flex items-center justify-end gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">{b.reviews[0].rating}/5 Reviewed</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {reviewingBooking && (
          <ReviewDialog
            isOpen={!!reviewingBooking}
            onClose={() => setReviewingBooking(null)}
            bookingId={reviewingBooking.id}
            trainerId={reviewingBooking.trainer_id}
            trainerName={reviewingBooking.trainer?.full_name ?? "Trainer"}
            onSuccess={() => void loadBookings()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
