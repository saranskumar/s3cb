# Tech Stack — S4 Architecture

## 1. Frontend Core
- **Framework**: Vite + React
- **Language**: JavaScript (ES6+)
- **State Management**: 
  - **Zustand**: Client-side state (Active Plan, Navigation, Modal states).
  - **TanStack Query (React Query)**: Server state synchronization, caching, and optimistic mutations.
- **Styling**: Vanilla CSS + Tailwind-like Utility Classes (Lucid Academic Theme).
- **Icons**: Lucide React.
- **Identity**: DiceBear API (Deterministic SVG avatars).

## 2. Backend & Persistence
- **Platform**: Supabase (BaaS)
- **Database**: PostgreSQL (with RLS for user isolation).
- **Authentication**: Supabase Auth (Email-only login).
- **Edge Runtime**: Supabase Edge Functions (Deno) for heavy logic and scheduling.
- **Serverless Automation**: `pg_cron` (invoking HTTP POST to Edge Functions).

## 3. PWA & Messaging
- **PWA Manifest**: Standard icon-set for mobile "Add to Home Screen" support.
- **Push Services**: 
  - **Web-Push API**: Browser-based messaging.
  - **VAPID**: Public/Private key signing for secure delivery.
- **Service Worker**: Handles background push events and notification rendering.

## 4. Development & Tooling
- **Package Manager**: pnpm (Critical: always use pnpm).
- **Validation**: Zod (Schema-based runtime validation).
- **Environment**: `.env.local` for sensitive VAPID and Supabase keys.
