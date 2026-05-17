# Serverless Attendance System

A serverless attendance backend built for college or office use with AWS Lambda, API Gateway, DynamoDB, and S3.

## Features

- Signup and login with email/password
- Mark attendance records in DynamoDB
- Upload attendance photos to S3
- Generate attendance reports automatically
- Uses AWS Lambda, API Gateway, DynamoDB, S3, IAM, and CloudWatch

## Project Structure

- `template.yaml` — AWS SAM template for Lambda functions, DynamoDB table, and S3 bucket
- `src/handlers` — Lambda handlers for signup, login, attendance, photo uploads, and reports
- `src/lib` — shared DynamoDB and response helper modules
- `website/` — static frontend website with login, attendance, photo upload, and report views

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build and deploy with AWS SAM:

   ```bash
   npm run deploy
   ```

   Follow the guided prompts to configure your stack.

3. Run the backend locally with SAM in local fallback mode when AWS credentials are unavailable:

   ```bash
   npm run local-api
   ```

   This uses `local-env.json` to set `LOCAL_MODE=true` inside the Lambda container. Then use `http://127.0.0.1:3000` as the API Base URL in the frontend or Streamlit app.

   In local mode, data is stored in `local-data/db.json` and uploaded photos are stored in `local-data/photos/`.

## API Endpoints

- `POST /signup`
  - Body: `{ "email": "user@example.com", "password": "secret", "name": "User Name" }`
- `POST /login`
  - Body: `{ "email": "user@example.com", "password": "secret" }`
- `POST /attendance`
  - Body: `{ "email": "user@example.com", "status": "present", "timestamp": "2026-05-17T08:00:00Z", "location": "Campus" }`
- `POST /photos`
  - Body: `{ "email": "user@example.com", "fileName": "photo.jpg", "imageBase64": "..." }`
- `GET /reports?email=user@example.com&startDate=2026-05-01&endDate=2026-05-31`

## Website

Open the static website at `website/index.html`, or run a local server:

```bash
npm run serve-website
```

Enter your deployed API Gateway endpoint in the website's API Base URL field, then use the forms to signup, login, mark attendance, upload photos, and generate reports.

## Streamlit Dashboard

The app can also run as a Streamlit dashboard:

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Enter your deployed API Gateway endpoint in the sidebar, then use the signup, login, attendance, photo upload, and report sections.

If you deploy to Streamlit Cloud, set an environment variable named `API_BASE_URL` (or add it in the app's Settings → Environment variables) to your deployed API Gateway URL (for example `https://abcd1234.execute-api.us-east-1.amazonaws.com/Prod`). The app will read that value automatically on startup and avoid trying to call `127.0.0.1`.

## Notes

- The DynamoDB table uses a single-table design with `PK` and `SK`.
- The S3 bucket stores uploaded photos under `photos/{email}/...`.
- This project is ready to extend with authentication tokens, frontend integration, and additional reporting.

