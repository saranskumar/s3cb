# S4 Command Center: Design Principles

## 1. Visual Language: Claymorphism
We avoid the "flat" look of modern SaaS. Instead, we use **Claymorphism**:
- **Tactile Depth**: Using `shadow-inner` and high-contrast outer shadows to make elements feel "puffy".
- **Density over Space**: Elements are large and deliberate. Every card is 100% focused on one piece of information.
- **Glassmorphism Accents**: Used for backgrounds (`App.jsx` layout) to provide a premium feel over a dark canvas.

## 2. Interaction Model: Physics-Based
- **Click Feedback**: Every primary action button scales down to `0.95` or `0.97` to simulate physical resistance.
- **Visual Completion**: Tasks don't just "disappear"; they transition to a grayscaled, semi-transparent state to maintain a historical record of the day's work.

## 3. Color Strategy: Mission-Critical
- **Cyan/Indigo**: The primary execution colors.
- **Emerald**: Reserved for absolute success (Completed/Mock Target met).
- **Amber/Orange**: Warning for near-misses.
- **Red**: Only for "Critical Need" (Vulnerabilities or Make-or-Break status).

## 4. Layout: The Execution Cockpit
- **Bottom Navigation**: Prioritized for mobile performance (thumb-friendly).
- **Tab Tray**: Large, recessed trays for switching contexts without losing place.
- **Focus Hierarchy**: The most important information (Next Exam, Current Task) is always the largest.
