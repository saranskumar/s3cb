# Feature Map — S4 Command Center

## 1. Onboarding & Workspace Initialization
- **Primary Goal:** Guide users to set up their S4 semester workspace instantly.
- **Paths:**
  - ***Start with S4 (Recommended):*** Instantly clones the global S4 template (Maths, AI, OS, DBMS, ADSA, Economics) into a private workspace for the user. It automatically injects the official exam dates and constructs a full module-wise syllabus hierarchy.
  - ***Start Blank:*** Allows creating a manual study planner if the user is not taking S4 constraints.
- **Mechanics:** 
  - Drives off PostgreSQL RPCs (`apply_s4_seed` and `complete_custom_onboarding`) to encapsulate complex insertions.
  - Stores a core `active_plan_id` reference locally and in Supabase to permanently lock the user's isolated context in the system.

## 2. Today View (Execution Tracker)
- **Primary Goal:** Give students an absolute single truth on "what I must do today."
- **Components:**
  - **Dynamic Progress Ring:** Large, satisfying visual completion gauge vs daily target.
  - **Overdue Pipeline:** Pulls incomplete tasks from the past and warns aggressively.
  - **Syllabus Linkage:** Readout directly shows the targeted `subject` allowing for context.
  - **Rollover Utility:** Cleanly pass un-met responsibilities to tomorrow.

## 3. Syllabus Master (Infrastructure)
- **Primary Goal:** A structured read-out mapping the entire examination scope.
- **Subject Hub:** Readout listing the 6 subjects, completion rate, days until the designated exam date and overall health.
- **Modular Hierarchy:** Displays subjects grouped by Modules natively (e.g., Module 1, Module 2) reducing cognitive load compared to flat tracking.
- **Topic Integration:** Allows adding single items straight to "Today's Tasks" via swift hover actions.

## 4. Modern Analytics View (Review Center)
- **Primary Goal:** Offer immediate reflection of overall progression health without demanding deep attention.
- **Components:**
  - **Aggregated Health Pills:** Totals for subjects, complete totals, pending totals, run-streak, and % aggregate completion.
  - **Subject Drill-Downs:** Lists each subject and provides an urgency-ranked colored badge calculating specific exam pressure constraints alongside their distinct completion rate bars.
  - **7-Day History Chart:** A vertical bar-graph indicating trailing velocity (checks completed per day over the trailing week).
  - **Exam Deadline Report:** A prioritized block highlighting which subjects are highest risk based on low completion % vs near time bounds.
