# Workflow Logic — S4 Command Center

## 1. Data Initialization & Scoping
1.  **Hydration**: `useAppData` performs a parallel fetch of `subjects`, `tasks`, `plans`, and `profiles`.
2.  **Context Lock**: Data is scoped to the `active_plan_id`. 
3.  **Identity Hydration**: Selected `avatar_url` is pulled from the profile. If undefined, the UI generates a deterministic avatar using the user's name/email.

## 2. Smart Auto-Scheduling Loop
1.  **Trigger**: `autoSeedRevisions` runs on app load (optimistic check).
2.  **Gap Analysis**: 
    - Sorts all subjects with `exam_date`.
    - Identifies empty days between consecutive exams.
3.  **Seeding**:
    - For the first exam: Seeds 2 days lead-time.
    - For subsequent exams: Fills the entire gap from the previous exam date to the current exam eve.
4.  **Deduplication**: Only inserts tasks that don't already exist in the `study_plan` for that user/date/title.

## 3. High-Performance Dashboard Logic
### Daily Execution
- **Output Peak**: Highlighted indigo blocks (`is_output_block = true` or keyword match).
- **Exam Day Morning**: Automatically replaces the standard greeting with a high-energy "Best of Luck" banner on exam dates.
- **Progress Sync**: Percentage is calculated in real-time based on `completed` vs `total` tasks for the selected date.

## 4. Gamification & Leaderboard Sync
1.  **Streak Calc**: Calibrated in `useAppData` by iterating backward through completed task dates.
2.  **State Sync**:
    - Streak and total completion counts are synced back to the `profiles` table via a fire-and-forget `update` on app load.
    - This ensures the **Hall of Focus** (Leaderboard) always has the latest global stats even if the user just completed a task.
3.  **Identity Persistence**: Profile changes (name, avatar) are committed to Supabase immediately and revalidated via TanStack Query.

## 5. Notification Lifecycle
1.  **Registration**: `useNotifications` hook handles the VAPID handshake and saves the endpoint to `push_subscriptions`.
2.  **Triggering**:
    - **Edge Function**: `send-reminders` processes logic in Deno.
    - **Timezone Awareness**: Multi-user local time delivery based on `tz_offset`.
3.  **Delivery**: Browser Service Worker receives the Push event and shows the stylized notification.
