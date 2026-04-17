# API Contracts — S4 Command Center

The application interacts with Supabase via the PostgREST API (JS Client) and custom RPC functions.

## 1. Table Definitions (Relational)

### `plans` (Workspaces)
- **Primary Data**: `id`, `user_id`, `title`, `description`, `source_template_id`, `created_at`.
- **Constraint**: `user_id` must match `auth.uid()`.

### `plan_templates` (Public Library)
- **Primary Data**: `id`, `title`, `description`, `is_public`.

### `subjects`
- **Primary Data**: `id`, `user_id`, `plan_id` (new), `name`, `exam_date`, `priority`, `template_subject_id` (new), `notes` (new).
- **Logic**: Now associated with a specific workspace (plan).

### `topics` (Flattened)
- **Primary Data**: `id`, `user_id`, `plan_id` (new), `subject_id`, `title`, `name`, `status` (`todo`, `done`, `mastered`, etc.), `is_weak`, `priority`, `sort_order`, `template_topic_id`.
- **Logic**: No longer grouped by `module_id` in the UI; directly managed under Subjects.

### `study_plan` (Tasks)
- **Primary Data**: `id`, `user_id`, `plan_id` (new), `subject_id`, `topic_id` (new), `date`, `title`, `planned_minutes`, `status`, `notes`.
- **Logic**: Primary source for the "Daily Mission" checklist. Linked to specific plans.

## 2. Onboarding Initialization

### RPC `apply_s4_seed`
`POST /rpc/apply_s4_seed`
- **Description:** Imports the global S4 template (Maths, AI, OS, DBMS, ADSA, Economics) into the user's private tables. Seeds Subjects, Modules, and Topics. Automatically creates an "S4 Exam Prep" record in the `plans` table and marks the user profile as onboarded. Also attaches standard exam dates and sorts correctly.
- **Payload:** `{ target_user_id: UUID }`
- **Returns:** The `plan_id` (UUID) created for the user.

### RPC `complete_custom_onboarding`
`POST /rpc/complete_custom_onboarding`
- **Description:** Finalizes the user's account initialization skipping all templates. Creates a blank standard "My Study Plan" inside the `plans` table.
- **Payload:** `{ target_user_id: UUID }`
- **Returns:** The `plan_id` (UUID) created for the user.

## 3. Remote Procedure Calls (RPC)

### `create_plan_from_template`
- **Purpose**: Creates a private `plan` record for a user from a public template.
- **Parameters**: `p_user_id` (uuid), `p_template_id` (uuid), `p_title` (text).

### `import_subject_to_plan`
- **Purpose**: Clones a subject template into a user's private plan.
- **Parameters**: `p_user_id` (uuid), `p_plan_id` (uuid), `p_template_id` (text).

### `import_subject_topics`
- **Purpose**: Automates copying all topic templates associated with a subject template into the user's plan.
- **Parameters**: `p_user_id` (uuid), `p_plan_id` (uuid), `p_subject_id` (text), `p_template_subject_id` (text).

## 3. Row Level Security (RLS)
Every table implements matching RLS policies:
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

## 4. Query Patterns
- **Unified Fetch**: The app fetches all core tables in a single `Promise.all` block within `useData.js`.
- **Upserting**: Reordering topics uses `upsert` with an array of Topic objects to perform a bulk sort-order sync.
