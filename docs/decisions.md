# Architecture Decisions — S4 Blueprint

## [2026-04-17] Single-Template Focus
**Context:** The app previously supported an arbitrary mix of plans, clones, and library structures. This fragmented the core value loop.
**Decision:** Hardcode the UX around a single built-in template: the "S4 Exam Prep". Remove dynamic plan template fetching in the UI. Users either import S4 or start with a custom blank plan.
**Consequences:** Simplifies onboarding to one click. Tightens the schema. Removes the `template_library` abstraction from the frontend entirely.

## [2026-04-17] Module-Grouped Topic Hierarchy
**Context:** Topics were previously fully flattened under subjects. This works for simple tasks but breaks down for 100+ topic engineering syllabi.
**Decision:** Restore the Module layer explicitly in the `SubjectDetailView.jsx`. Topics strictly belong to a Module, and Modules belong to a Subject. The UI leverages grouping and progressive disclosure (accordions).
**Consequences:** Keeps massive syllabi readable. Aligns with standard academic syllabus structure.

## Architecture Decision: Execution-First Logic

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
