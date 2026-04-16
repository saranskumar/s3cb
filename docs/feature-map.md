# Feature Map — S3 Comeback

The app is divided into three primary views and several ambient utilities.

## 1. Views

### Daily Plan
- **Phased Tracking**: Tasks are grouped by Phase (1, 2, 3), reflecting the timeline of the comeback.
- **Date Filtering**: Users can filter tasks by selecting a date in the Dashboard calendar.
- **Exam Status**: Specific days are marked as "Exam Days" with distinct amber styling and no checkbox.
- **Optimistic Toggles**: Checking a task provides instant confetti and persists to the backend.

### Subject Tracker
- **Granular Topics**: Each subject (Maths, TOC, DSA, ML, Digital, Ethics) has a dedicated tracker sheet.
- **Module Grouping**: Topics are grouped by module number.
- **Topic Management**: Addition of new topics directly from the UI. (Note: Delete functionality is currently UI-only).
- **Quick Notes**: Ability to save text notes locally for each topic (e.g., resources or difficult concepts).

### Dashboard
- **Completion Rate**: Dynamic progress bar showing total topics completed vs. remaining.
- **Study Streak**: Count of consecutive study days completed.
- **Calendar Widget**: Interactive view of the month, highlighting study vs. exam days.
- **Pomodoro Timer**: Adjustable focus timer with desktop notifications.

## 2. Global Utilities

- **Offline Sync**: A background indicator (Wifi icon) shows connectivity status. Offline changes are queued and synced automatically on reconnection.
- **Dark Mode**: High-contrast, slate/cyan theme designed for long study sessions.
- **Hourly Reminders**: Optional desktop notifications sent every hour to nudge the user to focus.
- **Confetti**: Visual reward system for completing study goals.
