# KōA (S4 Study Tracker) 🐨

KōA is a modern, high-performance Progressive Web Application (PWA) designed to help students track syllabi, maintain daily study habits, and compete on a global leaderboard. Built with a stunning "Claymorphism" UI and deep native mobile integration, KōA serves as an uncompromising, accountability-driven study companion.

## 🚀 Key Features

*   **Syllabus Mapping:** Define or dynamically generate full curriculums and subjects, breaking them down into actionable topics.
*   **Daily Clean-Slate Planner:** Plan exact topics per day. Incomplete tasks float to the top; completed tasks sink. Nudged forward seamlessly when skipped.
*   **Automated Nudges (Web Push):** A serverless `pg_cron` pipeline guarantees users receive Morning Wake-up (7 AM), Evening Nudges (8 PM), and fully customizable local-time reminders straight to their device OS.
*   **Global Leaderboard:** Compete in the "Hall of Focus". The ranking algorithm actively weights both unbroken streaks and raw intellectual volume (Tasks Completed) to determine your league (Iron to Diamond).
*   **Progressive Web App:** Fully installable to your Android/iOS home screen. Capable of offline data caching via Workbox and interactive Push API service workers.

## 🛠 Tech Stack

*   **Frontend:** React 19, Vite, Tailwind CSS v3
*   **State Management:** Zustand (Client State), TanStack React Query (Server State)
*   **UI/UX:** Native HTML standard, Custom CSS `clay-card` classes, Lucide Icons, Canvas Confetti
*   **Backend:** Supabase
    *   **Auth:** Email/Password via Supabase Auth
    *   **Database:** PostgreSQL with Row Level Security (RLS)
    *   **Automation:** `pg_cron` scheduling Deno Edge Functions
    *   **Edge Functions:** TypeScript routines handling Push Push Web standard (`web-push`) payloads bypassing gateway JWT limits natively.

## 🏃‍♂️ Getting Started

1.  **Clone the repository.**
2.  **Install exactly via pnpm:**
    ```bash
    pnpm install
    ```
3.  **Environment Setup:** Create a `.env.local` containing:
    ```env
    VITE_SUPABASE_URL=your-project-url
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
4.  **Database & Edge Functions:** Use the Supabase CLI to push migrations and deploy the notification engines.
    ```bash
    supabase db push
    supabase functions deploy send-reminders --no-verify-jwt
    ```
5.  **Run Development Server:**
    ```bash
    pnpm dev
    ```

## 🔒 Security Posture
*   Strict Postgres **Row Level Security (RLS)** isolates student data.
*   Edge Functions protected by internal **X-Cron-Secret** tokens.
*   Web Push payloads strictly omit sensitive internal data, utilizing Secure VAPID handshakes.

---

*“Start small, finish big.”*
