# Architecture Decisions — S3 Comeback

This document records the key architectural decisions made during the development of the S3 Comeback project.

## [ADR-001] Google Sheets as Backend
**Status**: Accepted
**Context**: The user needs a way to manage study data (subjects, topics, dates) easily without a custom database UI.
**Decision**: Use Google Sheets for data storage and Google Apps Script as the API layer.
**Consequences**: 
- (+) No cost hosting for the database.
- (+) Easy data entry via Google Sheets UI.
- (-) Latency (Apps Script can be slow).
- (-) CORS management requires specific `doOptions` handling.

## [ADR-002] PWA (Progressive Web App)
**Status**: Accepted
**Context**: The app is designed for daily study tracking, often on mobile.
**Decision**: Implement PWA features using `vite-plugin-pwa`.
**Consequences**:
- (+) Installable on home screen.
- (+) Works offline for viewing cached data.
- (+) Theme color integration for mobile browser bars.

## [ADR-003] Offline Queue System
**Status**: Accepted
**Context**: Users may check off tasks while studying in areas with poor internet.
**Decision**: Implement a custom `offlineQueue` in LocalStorage.
**Consequences**:
- (+) Tasks checked off offline are saved locally and synced when online.
- (+) Optimistic UI updates provide instant feedback regardless of network.

## [ADR-004] Centralized App State (Single File logic)
**Status**: Accepted
**Context**: The app is currently lightweight enough for a single main logic file (`App.jsx`).
**Decision**: Keep main logic in `App.jsx` but use logical sections and sub-components.
**Consequences**:
- (+) Faster initial development and easier overview.
- (-) `App.jsx` has grown to >800 lines; might need refactoring into separate component files if complexity increases.

## [ADR-005] User Notifications for Pomodoro and Reminders
**Status**: Accepted
**Context**: Keeping user focus is a core goal.
**Decision**: Use the Web Notifications API for hourly nudges and timer alerts.
**Consequences**:
- (+) Improved engagement.
- (-) Requires explicit user permission.
