import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, CalendarCheck, LayoutDashboard, ShieldCheck, Users, TrendingUp, TrendingDown, DollarSign, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/trainers", label: "Trainers", icon: ShieldCheck },
];

function AdminDashboard() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    totalClients: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingTrainers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && role && role !== "admin") {
      navigate({ to: role === "trainer" ? "/trainer" : "/client" });
    }
  }, [authLoading, role, navigate]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, trainersRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("user_roles").select("role"),
        supabase.from("trainer_profiles").select("is_approved"),
        supabase.from("bookings").select("total_price, commission_amount").eq("booking_status", "completed"),
      ]);

      const roles = rolesRes.data || [];
      const trainerProfiles = trainersRes.data || [];
      const completedBookings = bookingsRes.data || [];

      const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
      const totalCommission = completedBookings.reduce((sum, b) => sum + Number(b.commission_amount || 0), 0);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalTrainers: roles.filter((r) => r.role === "trainer").length,
        totalClients: roles.filter((r) => r.role === "client").length,
        totalRevenue,
        totalCommission,
        pendingTrainers: trainerProfiles.filter((t) => !t.is_approved).length,
      });
    } catch (error: any) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <DashboardLayout title="Admin Dashboard" nav={nav}>
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white shadow-elegant">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">Platform Overview</h2>
              <p className="mt-2 text-white/70">Monitor users, trainer approvals, and platform revenue.</p>
            </div>
            {stats.pendingTrainers > 0 && (
              <Button 
                onClick={() => navigate({ to: "/admin/trainers" })}
                className="bg-amber-500 text-white hover:bg-amber-600 border-none"
              >
                {stats.pendingTrainers} Pending Approvals
              </Button>
            )}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
            { label: "Total Clients", value: stats.totalClients, icon: User, color: "text-green-500" },
            { label: "Total Trainers", value: stats.totalTrainers, icon: ShieldCheck, color: "text-purple-500" },
            { label: "Platform Revenue", value: `$${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: "text-amber-500" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-gradient-card p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{loading ? "..." : s.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-gradient-card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Earnings Summary (10% Commission)
            </h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Total Gross Revenue</span>
                <span className="font-bold">${stats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Platform Commission (10%)</span>
                <span className="font-bold text-green-600">+${stats.totalCommission.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold">Net Platform Profit</span>
                <span className="text-2xl font-bold text-primary">${stats.totalCommission.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="border-border bg-gradient-card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              System Status
            </h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Trainer Approvals</span>
                <Badge variant={stats.pendingTrainers > 0 ? "default" : "secondary"}>
                  {stats.pendingTrainers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Storage (Avatars)</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Tracking Service</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
