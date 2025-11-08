# s3cb — Comeback Plan Tracker

Quick start
- Create a file .env.local at project root with:
  VITE_APPS_SCRIPT_URL="https://script.google.com/.../exec"
- Restart the Vite dev server after editing .env.local.

Vercel / Production
- Add an environment variable named `VITE_APPS_SCRIPT_URL` in your Vercel project settings (set for the appropriate Environment: Production / Preview / Development).
- Redeploy the site after setting the variable. The `VITE_` prefix is required so the URL is embedded at build time.

Apps Script (Google Sheets) notes
- Deploy your Apps Script as a Web App:
  - Execute as: Me
  - Who has access: Anyone (or Anyone with link as needed)
  - When you update the script, create a new deployment and use the new deployment URL.
- CORS: the Apps Script must expose CORS headers (and handle OPTIONS preflight). Ensure doGet/doPost responses include:
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Methods: GET, POST, OPTIONS
  - Access-Control-Allow-Headers: Content-Type
  or restrict origin to your domain in production.

Troubleshooting
- CORS errors: confirm the deployed Apps Script version contains the CORS handling and you are calling the correct deployment URL stored in Vercel.
- Missing env: if the app shows "APPS_SCRIPT_URL not set" restart dev server and confirm the variable exists in Vercel.

This is a complete Progressive Web App (PWA) study

Backend/API: Google Sheets + Google Apps Script

Deployment: Vercel

How to Set Up Your Own Tracker

You can set up your own version of this app in about ten minutes.

Part 1: The React App (Frontend)

First, clone the repository and install the dependencies.

Clone the Repo:

git clone [https://github.com/saranskumar/s3cb.git](https://github.com/saranskumar/s3cb.git)
cd s3cb


Install Dependencies:

pnpm install


(Leave this project folder open, you'll come back to it in Part 3).

Part 2: The Google Sheet (Backend)

Next, we'll set up the Google Sheet to act as your database and API.

Create a New Sheet: Go to sheets.new. Give it a name like "My S3 Tracker".

Open Apps Script: Click on Extensions > Apps Script.

Create setupData.gs:

Rename the default Code.gs file to setupData.gs.

Find the setupData.gs file in the appscript folder of the project you just cloned.

Copy the entire contents of that file and paste it into the Apps Script editor, replacing everything.

Create api.gs:

Click the + icon next to "Files" and select "Script".

Name the new file api.gs.

Find the api.gs file in the appscript folder of the cloned project.

Copy its contents and paste them into the new api.gs file in your Apps Script editor.

Save & Run Setup:

Click the "Save" icon.

Go back to your Google Sheet. Reload the page.

A new menu named "🚀 Comeback Plan" will appear. Click it, then click "Build My Tracker".

Authorize the script when prompted (Click Review permissions > your account > Advanced > Go to (unsafe) > Allow).

Your sheet will be populated with all the data.

Deploy the API (CRITICAL):

Go back to the Apps Script editor.

Click the Deploy button > New deployment.

Click the gear icon (Select type) and choose Web app.

For "Execute as", select Me.

For "Who has access", select Anyone.

Click Deploy.

Authorize the script again if it asks.

COPY the final Web app URL. This is your new API endpoint.

Part 3: Connect Frontend & Run

Connect the API:

Go back to your s3cb project folder on your computer.

Open src/App.jsx.

Find the line: const APPS_SCRIPT_URL = '...';

PASTE your new Web app URL inside the quotes.

Run Locally:

You're all set. Run the app in development mode to test it.

  pnpm run dev


Part 4: Deploy to Vercel

Push to GitHub:

Save your changes in src/App.jsx.

Commit and push your changes (with your new API URL) to your GitHub repo.

Import to Vercel:

Log in to Vercel and import your s3cb GitHub repository.

Set Framework Preset (CRITICAL):

In your new Vercel project's Settings > General tab...

...find "Framework Preset" and set it to "Vite".

Save your changes.

Deploy:

Trigger a new deployment from the Vercel dashboard.

Your PWA will now be live and fully synced with your Google Sheet.

Note: set VITE_APPS_SCRIPT_URL in Vercel to your Apps Script web app URL. Ensure the Apps Script deployment includes CORS headers and handles OPTIONS preflight.