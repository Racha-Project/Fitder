# LachaFit — Phased Build Plan

A production-ready fitness platform is too large for one turn. I'll ship it in 5 focused phases, each independently usable, so you can review and steer between phases.

## Tech foundations (all phases)
- React + TypeScript + TanStack Start (already scaffolded)
- Lovable Cloud (Supabase) for DB, Auth, Realtime, RLS
- Tailwind + shadcn/ui with a custom fitness design system (energetic, premium, mobile-first)
- Role-based routing via `_authenticated` layout + role guards
- TanStack Query for server state

---

## Phase 1 — Foundation, Auth, Design System (this turn)
**Goal: a beautiful landing page + working auth + role infrastructure.**

1. Enable Lovable Cloud
2. Design system in `src/styles.css` — vibrant fitness palette (energetic orange/lime accents on deep slate), Inter + Space Grotesk typography, gradients, shadows
3. Database schema (all tables from spec) + RLS policies + `user_roles` table (security best practice — roles NOT on profiles) + signup trigger
4. Auth pages: `/login`, `/register` (with role selection: client / trainer)
5. Landing page (`/`) — hero, features, trainer preview, CTA
6. About page (`/about`)
7. `_authenticated` layout with role-based redirect to `/client`, `/trainer`, or `/admin` dashboards
8. Dashboard shells for all 3 roles (sidebar nav, header, empty state)
9. Profile settings page (shared)

## Phase 2 — Trainer side
- Trainer profile management (bio, specialties, certifications, price, location, gym)
- Availability calendar (recurring weekly + one-time slots, edit/delete)
- Bookings inbox (accept/reject/complete)
- Client list view
- Earnings placeholder
- Trainer dashboard stats

## Phase 3 — Client discovery + booking
- Client profile (goal, budget, schedule, preferences, location)
- Trainer discovery page with filters (price, distance, specialty, rating, gender, experience)
- Trainer detail page with availability calendar
- Booking flow (select slot → confirm → pending → realtime status)
- Booking history + cancel
- Distance calculation (Haversine) + sort by nearest
- Reviews after completed sessions

## Phase 4 — Matching engine + AI Pose module
- Compatibility scoring function (weighted: goal 30%, distance 20%, availability 20%, budget 15%, specialty 10%, preference 5%)
- Recommended trainers page with badges (Best Match, Closest, Budget Friendly, Top Rated)
- AI Pose Training page: exercise selector, mock camera UI, simulated feedback, accuracy score, save session
- Pose history page

## Phase 5 — Admin + polish
- Admin dashboard (stats cards, charts via Recharts)
- User management table
- Trainer approval queue
- Booking monitoring
- Notifications (realtime bell + dropdown)
- Loading skeletons + empty states pass
- Mobile responsive QA

---

## What you get after Phase 1
A fully working app shell: anyone can register as client or trainer, log in, land on the right dashboard, edit their profile. Backend schema is complete so subsequent phases just plug in features.

**Confirm and I'll execute Phase 1 now.** Each later phase is one follow-up message ("do phase 2", etc.).