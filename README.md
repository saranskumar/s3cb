# s3cb — Study Plan Tracker

A minimal Progressive Web App (PWA) frontend that uses Google Sheets + Google Apps Script as a backend. This README gives concise setup and deployment steps.

Status
- Frontend: Vite + React (PWA)
- Backend: Google Sheets + Google Apps Script
- Deployment: Vercel

Quick Start (local)
1. Clone the repo:
   git clone https://github.com/saranskumar/s3cb.git
   cd s3cb
2. Install dependencies:
   pnpm install
3. Create a file at project root: `.env.local` and add:
   VITE_APPS_SCRIPT_URL="https://script.google.com/.../exec"
4. Start the dev server:
   pnpm run dev
5. If the app shows "APPS_SCRIPT_URL not set", restart the dev server after editing `.env.local`.

Apps Script (Google Sheets) — Setup
1. Create a new Google Sheet (e.g., "My S3 Tracker").
2. Open Extensions → Apps Script.
3. In the Apps Script editor:
   - Create or replace files with the `setupData.gs` and `api.gs` from this repo's `appscript` folder.
4. Save and run the setup function (to populate the sheet). Authorize when prompted.
5. Deploy the script as a Web App:
   - Deploy → New deployment → Select "Web app".
   - Execute as: Me
   - Who has access: Anyone (or Anyone with link)
   - Deploy and copy the Web app URL.

CORS requirement
The Apps Script must handle CORS and OPTIONS preflight. Responses from doGet/doPost should include headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type

Use the final Web app URL in `.env.local` (VITE_APPS_SCRIPT_URL).

Connecting frontend
- Open `src/App.jsx` (or `.env.local`) and ensure `VITE_APPS_SCRIPT_URL` points to your deployed Apps Script URL.
- Build/Run locally: pnpm run dev

Deploy to Vercel
1. Push changes to GitHub.
2. Import the repo to Vercel (or connect via Git).
3. In Vercel project settings:
   - Set Framework Preset: Vite
   - Add environment variable `VITE_APPS_SCRIPT_URL` (Production/Preview/Development as needed).
4. Trigger a deploy.

Troubleshooting
- CORS errors: confirm the deployed Apps Script version includes CORS headers and you're calling the correct deployment URL.
- Missing env at runtime: ensure `VITE_APPS_SCRIPT_URL` is present and the dev server was restarted after changes.
- Apps Script auth/permissions: if the script asks for additional permissions, redeploy after accepting.

Contributing
- Fork, branch, and submit PRs. Keep changes scoped and include tests where applicable.
