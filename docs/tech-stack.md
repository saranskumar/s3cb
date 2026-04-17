# Tech Stack — S4 Command Center

The S4 Command Center uses a high-performance **Fullstack Supabase** architecture, designed for real-time synchronization, secure multi-user data storage, and execution-first reactivity.

## Frontend
- **Core**: React 19 (Hooks, Functional Architecture)
- **Build Tool**: Vite 7
- **Styling**: Vanilla CSS + Tailwind CSS (Light Academic Theme: `cream`, `tea_green`, `celadon`, `muted_teal`)
- **Icons**: Lucide React
- **State Management**: 
    - **Zustand**: Global UI/View state and active plan selection.
    - **TanStack Query (v5)**: Server-state synchronization, scoped by `activePlanId`.
- **PWA Features**: `vite-plugin-pwa` for manifest and offline readiness.

## Backend
- **Engine**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth (Google OAuth 2.0 Integration)
- **Data Store**: Relational Postgres Tables with JSONB support.
- **Logic**: Postgres Functions (RPC) for complex migrations and seeding.
- **Security**: Row Level Security (RLS) policies enforcing per-user data isolation.

## Key Technical Specifications
| Component | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | ^19 |
| DB / Auth | Supabase | ^2 |
| Data Layer | TanStack Query | ^5 |
| Bundle Tool | Vite | ^7 |
| CLI / PM | PNPM | ^9+ |

## Environment Variables
| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for client-side API access. |
