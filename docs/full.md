# S4 Command Center: The Complete Blueprint

## 1. Executive Summary
The S4 Command Center is a high-performance study execution engine. Moving away from passive tracking, it enforces a disciplined "Execution-First" workflow, ensuring students know exactly what to do at every moment of their revision cycle.

---

## 2. Design System: Claymorphism
The application uses a custom **Claymorphism** design system to provide a tactile, premium, and engaging user experience.

### Visual Tokens
- **Surface**: Anthracite Dark (`#030712`) with Blur-12 glassmorphism layers.
- **Puffy Depth**: Every action card uses a double-layered shadow system (inset highlights + deep outer drops) to simulate physical depth.
- **Accent Colors**:
    - `Cyan`: Focus & Primary UI.
    - `Indigo`: Peak Performance & Intensity.
    - `Emerald`: Mastery & Success.
    - `Red`: Vulnerability & High-Priority Alerts.

### Interaction Model (UX)
- **Haptic Simulation**: Buttons and cards use CSS transforms (`scale-97`) to provide physical feedback.
- **Cognitive Load Reduction**: Management tools are separated into a "Plan" context, while daily work stays in "Action" context.

---

## 3. Product Features

### A. Dashboard (The High-Intensity Hub)
- **Focus Mode**: Dynamically isolates the "Immediate Task" and the "Output Peak" block.
- **Readiness Scoring**: Visual percentage representing global syllabus completion.
- **Strategic Warnings**:
    - **Countdown**: Days remaining until the next exam.
    - **Critical Subjects**: Auto-identifies subjects with "Make or Break" priority.

### B. Daily Mission Checklist
- **Atomic Operations**: Support for `Complete` (verify), `Push` (defer to next cycle), and `Skip` (archive).
- **Execution State**: Tasks transition from high-contrast Clay cards to low-opacity "Victory" states upon completion.
- **Peak Indicator**: Special Indigo styling for high-intensity output blocks.

### C. Syllabus Master
- **Modular Architecture**: Supports 3-level depth: Subject → Module → Topic.
- **Dynamic Reordering**: Move topics up or down to calibrate the study sequence.
- **Topic Registration**: Quick-add topics into any module with shadow-inner input fields.

### D. Analytics & Vulnerability Tracking
- **The Matrix**: Centralized list of all topics marked "Weak" across all subjects.
- **Mock Logs**: Performance tracking with score-to-target color mapping.
- **Power Stats**: Global completion %, Total study hours, and Task count.

---

## 4. Technical Stack
- **Frontend**: Vite + React + Tailwind CSS.
- **State Management**: Zustand (Client State) + TanStack Query (Server State).
- **Backend & Auth**: Supabase Auth (Google OAuth) + PostgreSQL + RLS.
- **Logic Layer**: Robust `useAppData` hook with centralized data transformation.

---

## 5. User Journey (UX Flow)
1. **Authentication**: Instant Google Sign-In via Claymorphized Auth Tray.
2. **Onboarding**: Choice between **Seeded Ecosystem** (pre-filled S4 plan) or **Total Control** (Blank Slate).
3. **Execution**: Daily check-in → Checklist completion → Peak Performance session.
4. **Maintenance**: Weekly mock logs → Vulnerability identification → Syllabus calibration.

---

## 6. Implementation Status
| Feature | Status |
|:--- |:--- |
| Claymorphism UI | Fully Implemented |
| Multi-User RLS | Fully Implemented |
| S4 Seed Migration | Fully Implemented |
| Topic Reordering | Fully Implemented |
| Push-to-Tomorrow | Fully Implemented |
| PWA Support | Ready for Manifest |
