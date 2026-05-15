import { Calendar, DollarSign, LayoutDashboard, User, Users } from "lucide-react";
import type { NavItem } from "@/components/dashboard-layout";

export const trainerNav: NavItem[] = [
  { to: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trainer/bookings", label: "Bookings", icon: Users },
  { to: "/trainer/availability", label: "Availability", icon: Calendar },
  { to: "/trainer/clients", label: "Clients", icon: Users },
  { to: "/trainer/earnings", label: "Earnings", icon: DollarSign },
  { to: "/trainer/profile", label: "Profile", icon: User },
];
