# Architecture Decision: Execution-First Logic

## Context
The previous iterations of the S4 app focused heavily on analytics and data entry. Users felt overwhelmed by charts and struggled to know which task to perform *right now*.

## Decision
Shift the architecture to an **Execution-First** model.

## Implementation
1.  **Dashboard Segregation**: Dashboard now only shows immediate actions and countdowns.
2.  **Explicit Focus States**: Logic added to identify "Output Peaks" and "Danger Subjects" automatically.
3.  **Checklist Dominance**: The "Today View" is the home screen of the productive user.
4.  **Decoupled Management**: Syllabus management (topics, modules) is moved to a dedicated "Syllabus Master" view to reduce cognitive load during study hours.

## Impact
- **Pros**: Clearer user path, reduced analysis paralysis.
- **Cons**: Requires more explicit interaction to manage data.

### 2026-04-17: Plan-Based Refactor & Light Theme
- **Decision**: Refactored the app from a basic exam tracker to a multi-workspace plan-based study planner with a public template library.
- **Rationale**: User needed support for structured plans containing specific subjects rather than a global list.
- **Change**: Added plans, plan_templates to Supabase schema. App UI converted completely to a Light Academic aesthetic (cream, celadon) from the original Dark Mode.
