# S3 Comeback — Project Context

## Project Overview
S3 Comeback is a personal study tracking application designed as a Progressive Web App (PWA). It uses a lightweight React frontend and a Google Sheets-based backend managed via Google Apps Script.

## Architecture Snapshot
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons.
- **Backend**: Google Apps Script acting as a JSON API over Google Sheets.
- **Persistence**: 
    - Google Sheets (Master records).
    - LocalStorage (Notes, Offline Queue, Reminders state).
- **Offline Strategy**: Optimistic UI with a background sync queue for `toggle` and `add` actions.

## Repository Structure
- `src/`: React application code (mostly in `App.jsx`).
- `appscript/`: Source code for the Google Apps Script backend.
- `docs/`: Comprehensive documentation (Tech Stack, API, Features, Logic, Design).
- `.project/`: Internal AI memory and decision logs.

## Current State & Known Gaps
- **Delete Functionality**: Frontend supports it in UI but backend `api.gs` lacks the handler.
- **Notes Sync**: Notes are purely local and do not sync to the cloud.
- **State Management**: Heavily reliant on local React state in a single file (`App.jsx`).
