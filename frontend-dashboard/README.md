# RiskOps Workbench (frontend)
Next.js 14 (App Router) + TypeScript + Tailwind + lucide-react. Role-based internal fraud-ops dashboard.

## Run
    npm install
    npm run dev      # http://localhost:3000  → redirects to /login

## Try it
Login page → tick "Viva demo mode" → pick a role. Or type an email containing `admin`, `lead` or `senior` (anything else = Analyst).

## Routes
`/login` · `/dashboard/[tab]` where tab depends on role (see `lib/roles.ts`), plus `/dashboard/settings` and `/dashboard/audit` (Team Lead and Admin only).

## What is real vs placeholder
- Real: role guards, per-role sidebar, countdown timers, claim / resolve / escalate flow, notes, audit log, CSV export, dark/light.
- Sample data: `lib/data.ts` (9 cases). Replace with Supabase queries + Realtime.
- Demo auth: `app/login/page.tsx` and `lib/store.tsx` (localStorage). Replace with Supabase Auth; RLS then enforces branch scope server-side. Hiding tabs is UX only, not security.
- Dashes (—) mark values that must come from the warehouse / drift APIs (`NEXT_PUBLIC_API_BASE`).
