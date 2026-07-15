# Splitwise — Frontend Foundation

Production-ready foundation for a mobile-first, PWA-oriented expense sharing application.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack Query + Zustand (configured, stores not yet created)
- React Hook Form + Zod
- Supabase (prepared, auth not yet implemented)
- PWA via `@ducanh2912/next-pwa`

## Getting Started

```bash

cp .env.example .env.local
npm install
npm run dev
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Routes, layouts, global UI files
│   ├── features/            # Feature modules (auth, groups, expenses, …)
│   ├── components/          # Shared UI (layout, shadcn primitives)
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   ├── services/            # API & data access layer
│   ├── lib/                 # Supabase clients, env, validation
│   ├── providers/           # Theme, Query, Toast
│   ├── store/               # Zustand (empty — added per feature)
│   └── styles/
├── middleware/              # Route protection utilities
└── public/                  # Manifest, icons, static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run build:pwa` | PWA build (webpack + service worker) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript |

## PWA

1. Set `NEXT_PUBLIC_ENABLE_PWA=true` in `.env.local`
2. Run `npm run build:pwa`
3. Run `npm run start` and open the production URL (not `npm run dev`)
4. Install from the browser (see below)

Icons live in `public/icons/`. Offline fallback page: `/offline`

## Architecture Principles

- **Mobile-first** — layouts target 375–430px; desktop is an enhancement
- **Feature-based** — business logic lives in `features/` and `services/`
- **Server Components by default** — client components only when required
- **No Supabase in components** — use `lib/supabase` and `services/`
- **No stores yet** — Zustand is installed; stores added when needed
- **RLS-ready** — only the public anon key is used on the frontend
