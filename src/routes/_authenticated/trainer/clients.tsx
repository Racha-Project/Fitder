import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { trainerNav } from "@/lib/trainer-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientSummary {
  id: string;
  full_name: string | null;
  email: string | null;
  fitness_goal: string | null;
  sessionCount: number;
}

export const Route = createFileRoute("/_authenticated/trainer/clients")({
  component: TrainerClientsPage,
});

function TrainerClientsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && role !== "trainer") {
      navigate({ to: role === "admin" ? "/admin" : "/client" });
    }
  }, [authLoading, role, navigate]);

  const loadClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("client_id, booking_status")
      .eq("trainer_id", user.id);

    if (error || !bookings?.length) {
      setClients([]);
      setLoading(false);
      return;
    }

    const counts = new Map<string, number>();
    for (const b of bookings) {
      counts.set(b.client_id, (counts.get(b.client_id) ?? 0) + 1);
    }

    const ids = [...counts.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, fitness_goal")
      .in("id", ids);

    setClients(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        fitness_goal: p.fitness_goal,
        sessionCount: counts.get(p.id) ?? 0,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  return (
    <DashboardLayout title="Clients" nav={trainerNav}>
      <div className="mx-auto max-w-3xl space-y-4">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading clients...</Card>
        ) : clients.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <h3 className="font-display text-lg font-semibold">No clients yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Clients appear here after they book a session with you.</p>
          </Card>
        ) : (
          clients.map((c) => (
            <Card key={c.id} className="flex items-center justify-between border-border bg-gradient-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                  {(c.full_name ?? "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{c.full_name ?? "Client"}</p>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                  {c.fitness_goal && (
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{c.fitness_goal.replace(/_/g, " ")}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary">{c.sessionCount} booking{c.sessionCount !== 1 ? "s" : ""}</Badge>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
