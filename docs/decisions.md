# Architecture Decisions — S4 Blueprint

## [2026-04-19] Automated Study Bridge (Gap-Filling)
**Context:** Students often lose momentum between exams, unsure of what subject to prioritize immediately following a big test.
**Decision:** Implement a "Smart Gap Filling" logic within the `autoSeedRevisions` workflow.
**Implementation:** The logic identifies chronological exam pairs and populates every intervening day with a revision task for the *next* subject.
**Consequences:** Ensures the "Today" list is never empty during high-stakes weeks and provides a clear transition path.

## [2026-04-19] Deterministic & Persistent Identity
**Context:** The app lacked personalization, making the leaderboard feel anonymous and cold.
**Decision:** Implement a `profiles` table with `avatar_url` persistence.
**Implementation:** Use DiceBear APIs for variety (Heroes, Vibes, Bots, Pixels). Use deterministic fallbacks based on user name/email to ensure every user has a default identity even without a manual choice.
**Consequences:** Increases user engagement and competitive transparency in the "Hall of Focus".

## [2026-04-19] Hybrid Notification Architecture
**Context:** Reliability of in-browser timers for 7AM/8PM nudges is low on mobile devices due to background suspension.
**Decision:** Shift to server-side push via Supabase Edge Functions (`send-reminders`) and `pg_cron`.
**Implementation:** Use Web-Push (VAPID) and store `tz_offset` in profile preferences to allow for correct global delivery of time-sensitive nudges.
**Consequences:** Guaranteed delivery of morning and evening reminders regardless of browser state.

---

## [2026-04-17] Single-Template Focus
**Context:** The app previously supported an arbitrary mix of plans, clones, and library structures. This fragmented the core value loop.
**Decision:** Hardcode the UX around a single built-in template: the "S4 Exam Prep". Remove dynamic plan template fetching in the UI. Users either import S4 or start with a custom blank plan.
**Consequences:** Simplifies onboarding to one click. Tightens the schema. Removes the `template_library` abstraction from the frontend entirely.

## [2026-04-17] Module-Grouped Topic Hierarchy
**Context:** Topics were previously fully flattened under subjects. This works for simple tasks but breaks down for 100+ topic engineering syllabi.
**Decision:** Restore the Module layer explicitly in the `SubjectDetailView.jsx`. Topics strictly belong to a Module, and Modules belong to a Subject. The UI leverages grouping and progressive disclosure (accordions).

## Architecture Decision: Execution-First Logic
**Context:** The previous iterations focused heavily on analytics. Users felt overwhelmed and struggled to know which task to perform *right now*.
**Decision:** Shift the architecture to an **Execution-First** model. Checklist dominance in the "Today View" is the home screen of the productive user.
