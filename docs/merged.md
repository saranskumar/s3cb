# S4 Study Planner: Study Mission Checklist & Reminder System

This document details the refactored architecture of the S4 Study Planner, shifting from a heavy management console to a lightweight, daily execution todo list.

---

## 1. Core Philosophy: The Study Todo list
The app is a **high-performance daily planner** focused on answering one question: "What do I need to study right now?"

### Primary User Flow
1. **Sign In**: Instant access to your study mission.
2. **Today View**: See a grouped list of Overdue, Today's, and Upcoming tasks.
3. **Execution**: Mark tasks as done to update global progress and maintain your study streak.
4. **Planning**: Use the Subjects view to drill down and assign specific topics to today or tomorrow.

---

## 2. Design System: Tactile Study Cockpit
(Ref: design-principles.md)

### Visual Style: Claymorphism
- **Task Cards**: Puffy, 3D cards that grayscale and dim when completed, providing satisfying visual closure.
- **Urgency Markers**: Red-bordered cards for overdue missions; Cyan for today’s active targets.

---

## 3. Key Feature Modules

### A. Today View (The Landing Zone)
- **Overdue Section**: Explicitly calls out tasks missed from previous days.
- **Today's Targets**: The primary checklist for the current date.
- **Future Ops**: A glimpse of planned tasks for the coming days.
- **Progress Summary**: Real-time visualization of daily completion %.

### B. Summary Dashboard (Lite Analytics)
- **Street Counter**: Tracks consecutive days with completed tasks.
- **Next Exam Countdown**: Highlights the most urgent academic deadline.
- **Subject Pulse**: Simplified completion percentages for all enrolled subjects.

### C. Subject Detail & Topic Planning
- **Modular Breakdown**: Subjects are organized into units/modules.
- **Quick Planning**: Actionable buttons to "Plan for Today" or "Plan for Tomorrow" for any given topic.
- **Direct Completion**: Mark topics as "Done" directly to update mastery scores.

### D. Smart Reminders
- **Notification API**: Browser-native alerts to remind users of pending tasks.
- **Mission Banner**: Persistent in-app banners notifying users of active targets for the day.

---

## 4. Technical Architecture
(Ref: tech-stack.md)

### Data Engine
- **`study_plan` Table**: The centralized log for all dated tasks.
- **`topics` Table**: The relational source for curriculum nodes and mastery status.
- **Streak Logic**: Calculated on-the-fly based on historical completion records across the `study_plan`.

### Synchronization
- **TanStack Query**: Manages optimistic UI updates and background refetches.
- **Supabase RLS**: Ensures all study missions, topics, and sessions are strictly private to the authenticated user.

---

## 5. Implementation Status: Study Planner Refactor
| Feature | Status |
|:--- |:--- |
| Today-First Navigation | Active |
| Overdue/Upcoming Grouping | Active |
| Browser Notifications | Enabled |
| In-app Reminder Banners | Active |
| Quick Topic Planning | Active |
| Streak Calculation | Implemented |
| Lightweight Summary Dash | Active |
