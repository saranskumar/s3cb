# Design Principles — S3 Comeback

The visual identity of S3 Comeback is designed to provide a "dark mode by default" environment that reduces eye strain and emphasizes progress through vibrant accents.

## 1. Aesthetic Identity (Dark Cyber)

- **Primary Background**: Slate-950 (`#020617`).
- **Surface Colors**: Slate-900 border and backgrounds for cards/widgets.
- **Primary Accent**: Cyan-500/600 (`#06b6d4`). Used for buttons, progress bars, and high-priority states.
- **Secondary Accents**: 
    - Emerald for success/completion.
    - Amber for exam days and warnings.
    - Indigo/Blue for subtle gradients.

## 2. Typography

- **Font**: Standard Sans-serif stack (Inter/system-ui).
- **Hierarchy**:
    - **Titles**: Extrabold uppercase or tracking-tight headings.
    - **Labels**: Small uppercase labels with tracking-wider for dashboard stats.
    - **Monospace**: Used specifically for the Pomodoro timer and code-like data (Dates).

## 3. Micro-interactivity

- **Feedback Loops**:
    - **Checkboxes**: Scale-up and shadow glow when checked.
    - **Confetti**: High-energy burst on "Done" actions.
    - **Transfers**: Smooth `transition-all` on tab switches and filtering.
- **Animations**:
    - `animate-in` and `fade-in` for modals and toast notifications.
    - `animate-spin` for loading/syncing indicators.

## 4. Mobile First

- **Touch Targets**: Checkboxes and tab buttons are sized for easy thumb interaction.
- **Horizontal Scroll**: Tab bar uses `-mx-4 px-4` and `no-scrollbar` to allow endless scrolling of subject trackers on small screens.
- **Stand-alone mode**: PWA manifest ensures no browser chrome (URL bar, etc.) appears, providing a native app feel.
