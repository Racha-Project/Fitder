import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Shield, User, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/trainers")({
  component: AdminTrainersPage,
});

const nav = [
  { to: "/admin", label: "Overview", icon: User },
  { to: "/admin/users", label: "Users", icon: User },
  { to: "/admin/trainers", label: "Trainers", icon: Shield },
];

function AdminTrainersPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && role && role !== "admin") {
      navigate({ to: role === "trainer" ? "/trainer" : "/client" });
    }
  }, [authLoading, role, navigate]);

  const loadTrainers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trainer_profiles")
      .select(`
        id, user_id, bio, experience_level, is_approved, created_at,
        profiles (full_name, email, avatar_url)
      `)
      .order("is_approved", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else setTrainers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTrainers();
  }, [loadTrainers]);

  const toggleApproval = async (trainerId: string, currentStatus: boolean) => {
    setActioningId(trainerId);
    const { error } = await supabase
      .from("trainer_profiles")
      .update({ is_approved: !currentStatus })
      .eq("id", trainerId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentStatus ? "Trainer access revoked" : "Trainer approved");
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainerId ? { ...t, is_approved: !currentStatus } : t))
      );
    }
    setActioningId(null);
  };

  return (
    <DashboardLayout title="Trainer Approvals" nav={nav}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Manage Trainer Access</h2>
          <p className="text-sm text-muted-foreground">Trainers must be approved before they can accept bookings.</p>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : trainers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No trainers found.
                  </TableCell>
                </TableRow>
              ) : (
                trainers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={t.profiles?.avatar_url || ""} />
                          <AvatarFallback>{(t.profiles?.full_name || "T").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{t.profiles?.full_name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">{t.profiles?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {t.experience_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.is_approved ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={t.is_approved ? "outline" : "default"}
                        size="sm"
                        className={t.is_approved ? "text-destructive border-destructive hover:bg-destructive/10" : "bg-green-600 hover:bg-green-700"}
                        onClick={() => toggleApproval(t.id, t.is_approved)}
                        disabled={actioningId === t.id}
                      >
                        {actioningId === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : t.is_approved ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Revoke
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
