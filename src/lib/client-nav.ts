import { Activity, Calendar, Compass, Sparkles, User } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

export const clientNav: NavItem[] = [
  { to: "/client", label: "Dashboard", icon: Activity },
  { to: "/client/matches", label: "Matches", icon: Sparkles },
  { to: "/client/profile", label: "Profile", icon: User },
  { to: "/client/discover", label: "Discover", icon: Compass },
  { to: "/client/bookings", label: "Bookings", icon: Calendar },
  { to: "/client/pose", label: "AI Pose", icon: Activity },
];
