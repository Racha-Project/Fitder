import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, CalendarCheck, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/trainers", label: "Trainers", icon: ShieldCheck },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminDashboard() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: role === "trainer" ? "/trainer" : "/client" });
    }
  }, [loading, role, navigate]);

  return (
    <DashboardLayout title="Admin Dashboard" nav={nav}>
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-border bg-gradient-hero p-8 text-white shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Platform overview</h2>
          <p className="mt-2 text-white/70">Monitor users, trainers, bookings, and AI sessions across LachaFit.</p>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total users", value: "—" },
            { label: "Trainers", value: "—" },
            { label: "Clients", value: "—" },
            { label: "Active bookings", value: "—" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-gradient-card p-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="border-dashed border-border bg-card p-12 text-center">
          <h3 className="font-display text-xl font-semibold">Admin tooling coming in Phase 5</h3>
          <p className="mt-2 text-muted-foreground">User management, trainer approvals, and analytics charts arrive in the final phase.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
