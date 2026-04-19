# KōA Study Planner: Consolidated Documentation

This document serves as the single source of truth for the KōA Study Planner, merging core features, architecture, and logic.

---

## 1. Feature Map — S4 Command Center

### Onboarding & Workspace Initialization
- **Primary Goal:** Guide users to set up their S4 semester workspace instantly.
- **Paths:**
  - ***Start with S4 (Recommended):*** Instantly clones the global S4 template (Maths, AI, OS, DBMS, ADSA, Economics) into a private workspace for the user. It automatically injects the official exam dates and constructs a full module-wise syllabus hierarchy.
  - ***Start Blank:*** Allows creating a manual study planner if the user is not taking S4 constraints.
- **Mechanics:** 
  - Drives off PostgreSQL RPCs (`apply_s4_seed` and `complete_custom_onboarding`) to encapsulate complex insertions.
  - Stores a core `active_plan_id` reference locally and in Supabase to permanently lock the user's isolated context in the system.

### Today View (Execution Tracker)
- **Primary Goal:** Give students an absolute single truth on "what I must do today."
- **Components:**
  - **Dynamic Progress Ring:** Large, satisfying visual completion gauge vs daily target.
  - **Overdue Pipeline:** Pulls incomplete tasks from the past and warns aggressively.
  - **Syllabus Linkage:** Readout directly shows the targeted `subject` allowing for context.
  - **Rollover Utility:** Cleanly pass un-met responsibilities to tomorrow.
  - **Exam Day Banners**: Real-time high-intensity motivational banners that trigger on specific exam dates to boost student morale.

### Syllabus Master (Infrastructure)
- **Primary Goal:** A structured read-out mapping the entire examination scope.
- **Subject Hub:** Readout listing the 6 subjects, completion rate, days until the designated exam date and overall health.
- **Modular Hierarchy:** Displays subjects grouped by Modules natively (e.g., Module 1, Module 2) reducing cognitive load compared to flat tracking.
- **Topic Integration:** Allows adding single items straight to "Today's Tasks" via swift hover actions.

### 4. Modern Analytics View (Review Center)
- **Primary Goal:** Offer immediate reflection of overall progression health without demanding deep attention.
- **Components:**
  - **Aggregated Health Pills:** Totals for subjects, complete totals, pending totals, run-streak, and % aggregate completion.
  - **Subject Drill-Downs:** Lists each subject and provides an urgency-ranked colored badge calculating specific exam pressure constraints alongside their distinct completion rate bars.
  - **7-Day History Chart:** A vertical bar-graph indicating trailing velocity (checks completed per day over the trailing week).
  - **Exam Deadline Report**: A prioritized block highlighting which subjects are highest risk based on low completion % vs near time bounds.

### 5. Public Identity & Hall of Focus
- **Primary Goal:** Foster community transparency and competitive motivation.
- **Identity Picker**: A four-category avatar gallery (Heroes, Vibes, Bots, Pixels) providing instant, persistent identities.
- **Global Leaderboard**: A real-time ranking system (Hall of Focus) that lists students by current streak and completed tasks.
- **Podium Ceremony**: Highlights the Top 3 performers with specialized avatars and visual accolades.

### 6. Smart Study Automation
- **Primary Goal:** Minimize planning friction during the stressful exam season.
- **Gap-Filling Scheduler**: An intelligent backend logic that automatically bridges the gaps between exams, populating "free days" with targeted revision for the next upcoming subject.
- **Exam Awareness**: Gold shield indicators in the Planner date-strip providing instant visual feedback on upcoming high-stakes dates.
- **PWA Push Notifications**: Context-aware 7AM/8PM nudges and 9AM Exam Day "Best of Luck" pushes.

---

## 2. Tech Stack — S4 Architecture

### Frontend Core
- **Framework**: Vite + React
- **Language**: JavaScript (ES6+)
- **State Management**: 
  - **Zustand**: Client-side state (Active Plan, Navigation, Modal states).
  - **TanStack Query (React Query)**: Server state synchronization, caching, and optimistic mutations.
- **Styling**: Vanilla CSS + Tailwind-like Utility Classes (Lucid Academic Theme).
- **Icons**: Lucide React.
- **Identity**: DiceBear API (Deterministic SVG avatars).

### Backend & Persistence
- **Platform**: Supabase (BaaS)
- **Database**: PostgreSQL (with RLS for user isolation).
- **Authentication**: Supabase Auth (Email-only login).
- **Edge Runtime**: Supabase Edge Functions (Deno) for heavy logic and scheduling.
- **Serverless Automation**: `pg_cron` (invoking HTTP POST to Edge Functions).

### PWA & Messaging
- **PWA Manifest**: Standard icon-set for mobile "Add to Home Screen" support.
- **Push Services**: 
  - **Web-Push API**: Browser-based messaging.
  - **VAPID**: Public/Private key signing for secure delivery.
- **Service Worker**: Handles background push events and notification rendering.

### Development & Tooling
- **Package Manager**: pnpm (Critical: always use pnpm).
- **Validation**: Zod (Schema-based runtime validation).
- **Environment**: `.env.local` for sensitive VAPID and Supabase keys.

---

## 3. Architecture Decisions — S4 Blueprint

### [2026-04-19] Automated Study Bridge (Gap-Filling)
**Decision:** Implement a "Smart Gap Filling" logic within the `autoSeedRevisions` workflow to identify chronological exam pairs and populate every intervening day with a revision task for the *next* subject.

### [2026-04-19] Deterministic & Persistent Identity
**Decision:** Implement a `profiles` table with `avatar_url` persistence using DiceBear APIs (Heroes, Vibes, Bots, Pixels). Every user has a default identity even without a manual choice.

### [2026-04-19] Hybrid Notification Architecture
**Decision:** Shift to server-side push via Supabase Edge Functions (`send-reminders`) and `pg_cron` using Web-Push (VAPID) and user-specific `tz_offset`.

### [2026-04-17] Single-Template Focus
**Decision:** Hardcode the UX around a single built-in template: the "S4 Exam Prep". Remove dynamic plan template fetching in the UI.

### [2026-04-17] Module-Grouped Topic Hierarchy
**Decision:** Restore the Module layer explicitly in the `SubjectDetailView.jsx`. Topics strictly belong to a Module, and Modules belong to a Subject.

---

## 4. API Contracts — S4 Data Boundary

### Profiles (Identity Boundary)
- **Table**: `public.profiles`
- **Fields**: `id`, `display_name`, `avatar_url`, `current_streak`, `best_streak`, `completed_tasks`, `show_on_leaderboard`, `active_plan_id`.

### Subjects (Resource Boundary)
- **Table**: `public.subjects`
- **Fields**: `id`, `name`, `exam_date`, `priority`.

### Study Plan (Execution Boundary)
- **Table**: `public.study_plan`
- **Fields**: `id`, `subject_id`, `date`, `title`, `status`, `planned_minutes`.

### Notifications (Messaging Boundary)
- **Table**: `public.notification_preferences` (`enabled`, `reminder_times`, `tz_offset`).
- **Table**: `public.push_subscriptions` (`endpoint`, `p256dh`, `auth`).

---

## 5. Workflow Logic — S4 Command Center

### Data Initialization & Scoping
1. **Hydration**: `useAppData` performs a parallel fetch of all plan context.
2. **Context Lock**: Data is scoped to the `active_plan_id`. 
3. **Identity Hydration**: Selected `avatar_url` is pulled from the profile or generated deterministically.

### Smart Auto-Scheduling Loop
1. **Trigger**: `autoSeedRevisions` runs on app load.
2. **Gap Analysis**: Identifies empty days between consecutive exams.
3. **Seeding**: Seeds 2-day lead for first exam and fills subsequent gaps.

### Gamification & Leaderboard Sync
1. **Streak Calc**: Calibrated in `useAppData` based on historical task completion.
2. **State Sync**: Streak and total completion counts are synced back to the `profiles` table on app load to ensure the **Hall of Focus** is up-to-date.

---

## 6. KōA Notification System Documentation

### Architecture Overview
The system uses a **Decoupled PWA Architecture** that bridges the browser's Push API with Supabase Edge Functions.

### Message Catalog
| Trigger | Context | Title | Body Copy |
| :--- | :--- | :--- | :--- |
| **7 AM Wakeup** | Tasks pending | Morning! Rise and Grind ☀️ | You have {N} tasks for today! |
| **8 PM Nudge** | Tasks pending | Closing the day? | You have {N} tasks left. Keep your streak alive! 🔥 |
| **Custom Slot** | Tasks pending | Ready to study? | You have {N} tasks for today. Start small, finish big. |

---

## 7. S4 Command Center: Design Principles

### Visual Language: Claymorphism
- **Tactile Depth**: Using `shadow-inner` and high-contrast outer shadows to make elements feel "puffy".
- **Glassmorphism Accents**: Used for backgrounds to provide a premium feel.

### Interaction Model: Physics-Based
- **Click Feedback**: Every primary action button scales down to simulate physical resistance.
- **Visual Completion**: Tasks transition to a grayscaled state to maintain a historical record.
