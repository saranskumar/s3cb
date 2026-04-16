# Tech Stack — S3 Comeback

The S3 Comeback tracker is built on a "headless" architecture, using a modern PWA frontend and a Google Sheets-based backend for accessibility and ease of data management.

## Frontend

- **Core**: React 19 (Functional components, Hooks)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **Animations/Visuals**: `canvas-confetti`
- **PWA Features**: `vite-plugin-pwa` for manifest and service worker management.
- **Deployment**: Vercel

## Backend

- **Engine**: Google Apps Script (GS)
- **Data Store**: Google Sheets
- **Communication**: Custom JSON-over-HTTP API (doGet/doPost)

## Key Technical Specifications

| Component | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | ^19.1.1 |
| Styling | Tailwind CSS | ^3.4.14 |
| Bundle Tool | Vite | ^7.1.7 |
| PWA Engine | Vite PWA Plugin | ^1.1.0 |
| Backend | Google Apps Script | - |
| Data Layer | Google Sheets API | V4 (via Apps Script) |

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_APPS_SCRIPT_URL` | The public Web App URL of the deployed Apps Script. |
