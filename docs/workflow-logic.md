# Workflow Logic — S4 Command Center

This document explains the technical work flows and data synchronization patterns of the S4 Blueprint.

## 1. Data Synchronization (Supabase + TanStack Query)

### Initialization
1.  **Auth Check**: `App.jsx` checks the Supabase session on mount.
2.  **Data Hydration**: The `useAppData` hook triggers a parallel fetch from `plans`, `subjects`, `study_plan`, `topics`, and `profiles`. It also fetches global `templates`.
3.  **Active Plan Scoping**: Data is filtered by `activePlanId` (stored in Zustand and synced with the user's profile).
4.  **Transformation**: Raw data is transformed into a Workspace-specific dashboard object.

### The Mutation Loop
1.  **Action Trigger**: User performs an action (e.g., completes a task).
2.  **Request**: `useDataMutation` sends a targeted SQL update to Supabase.
3.  **Validation**: Row Level Security (RLS) ensures the user only modifies their own UUID-bound records.
4.  **Revalidation**: On successful response, `invalidateQueries` is called on `appData`, triggering a background refetch to keep the execution UI fresh.

### Offline Resilience
-   The current implementation relies on active connectivity.
-   Future sync logic (Service Workers) is planned for the PWA manifest stage.

## 2. Onboarding & Workspace Setup

### Workspace Initiation
1.  Users start at the **Workspaces** (Plans) view if no active plan exists.
2.  **Template Import**: Calls RPC `create_plan_from_template`, then triggers `import_subject_to_plan` and `import_subject_topics` to clone curriculum templates.
3.  **Custom Plans**: Allows users to create blank workspaces from scratch.

### Flattened Syllabus
-   **No Module Nesting**: Topics are linked directly to Subjects to reduce clicks and complexity.
-   **Mastery States**: Topics cycle through boolean 'done' or enum-based mastery levels.

## 3. High-Performance Dashboard Logic

### Output Peak Identification
The dashboard identifies an "Output Peak" block by searching today's tasks for:
1.  A flag `is_output_block = true`.
2.  Keywords like "Output" or "Peak" in the title.
3.  This block is given specialized Indigo styling to signify its importance.

### Danger Subject Identification
The system flags a subject as a "Danger Subject" if:
1.  Its priority status is set to `make_or_break`.
2.  It has uncompleted topics and a high internal score requirement.

## 4. Navigation & View State
-   Managed via **Zustand** in `useAppStore`.
-   Context-sensitive routing allows the app to maintain the `selectedSubjectId` even when switching between Dashboard and Subject Detail views.
