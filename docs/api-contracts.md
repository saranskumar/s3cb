# API Contracts — S3 Comeback

The app communicates with a Google Apps Script Web App. All requests must use `Content-Type: text/plain;charset=utf-8` to bypass traditional CORS preflight limitations (though the backend also implements `doOptions`).

## Endpoint Base URL
Referenced via `VITE_APPS_SCRIPT_URL`.

## 1. Fetch All Data (GET)
- **Method**: `GET`
- **Response Shape**:
  ```json
  {
    "Daily_Plan": [ ["Done", "Date", "Subject", ...], [false, "Nov 9", ...] ],
    "Maths_Tracker": [ ["Done", "Module", "Topic"], [...] ],
    "..." : []
  }
  ```
- **Note**: The first row of every array is the header.

## 2. Update Actions (POST)
All POST requests send a JSON payload as raw text.

### Toggle Checkbox
- **Payload**:
  ```json
  {
    "action": "toggleCheckbox",
    "sheetName": "Daily_Plan",
    "rowIndex": 0,
    "value": true
  }
  ```
- **Success Response**: `{ "status": "success", "action": "toggle", ... }`

### Add New Topic
- **Payload**:
  ```json
  {
    "action": "addTopic",
    "sheetName": "Maths_Tracker",
    "moduleNum": 1,
    "topicName": "Probability Distributions"
  }
  ```
- **Success Response**: `{ "status": "success", "action": "add", ... }`

## 3. Known Issues / Omissions
- **Delete Action**: The frontend sends `{ "action": "deleteTopic", ... }`, but the **current backend implementation does not support this action** and will return an error.
- **Notes Action**: Notes are currently saved **only in LocalStorage** (`s3_notes`) and are not synced to Google Sheets.
