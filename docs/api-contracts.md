# API Contracts — S4 Data Boundary

## 1. Profiles (Identity Boundary)
### Table: `public.profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary key (FK to auth.users) |
| `display_name` | text | User's public handle (auto-generated if missing) |
| `avatar_url` | text | Selected Identity (Heroes, Vibes, Bots, Pixels) |
| `current_streak` | int | Active daily study streak |
| `best_streak` | int | All-time highest study streak |
| `completed_tasks` | int | Total global task completion count |
| `show_on_leaderboard` | bool | Opt-in flag for public transparency |
| `active_plan_id` | uuid | Foreign key to the user's primary workspace |

## 2. Subjects (Resource Boundary)
### Table: `public.subjects`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary key |
| `name` | text | e.g., "Maths", "AI" |
| `exam_date` | date | Designated day of examination (used for banners/scheduling) |
| `priority` | enum | `low`, `medium`, `high`, `make_or_break` |

## 3. Study Plan (Execution Boundary)
### Table: `public.study_plan`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary key |
| `subject_id` | uuid | FK to subjects |
| `date` | date | Scheduled day of performance |
| `title` | text | Task name (e.g. "Full Revision: AI") |
| `status` | enum | `pending`, `completed`, `skipped` |
| `planned_minutes` | int | Default estimated duration |

## 4. Notifications (Messaging Boundary)
### Table: `public.notification_preferences`
| Column | Type | Description |
| :--- | :--- | :--- |
| `enabled` | bool | Master toggle for push |
| `reminder_times` | jsonb | Array of time strings (e.g. `["09:00"]`) |
| `tz_offset` | int | Timezone offset in minutes (critical for Edge delivery) |

### Table: `public.push_subscriptions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `endpoint` | text | PWA Push service endpoint |
| `p256dh` | text | Browser security key |
| `auth` | text | Browser auth secret |
