# 🚀 StadiumOS – Deployment Guide

## Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env    # edit with your Firebase project ID
npm install
npm run dev             # → http://localhost:8080

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev             # → http://localhost:3000/dashboard
```

---

## Docker Build (Single Container)

```bash
# From the project root (stadiumos/)
docker build -t stadiumos .
docker run -p 8080:8080 -e NODE_ENV=production stadiumos
```

Open http://localhost:8080 — serves both API and frontend.

---

## Deploy to Google Cloud Run

### Prerequisites
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- A GCP project with billing enabled
- (Optional) Firebase project for Firestore

### Step 1: Set your project

```bash
export PROJECT_ID=your-gcp-project-id
gcloud config set project $PROJECT_ID
```

### Step 2: Enable required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 3: Build & push with Cloud Build

```bash
# From the project root (stadiumos/)
gcloud builds submit --tag gcr.io/$PROJECT_ID/stadiumos
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy stadiumos \
  --image gcr.io/$PROJECT_ID/stadiumos \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FIREBASE_PROJECT_ID=$PROJECT_ID \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

### Step 5: Get the URL

```bash
gcloud run services describe stadiumos \
  --region us-central1 \
  --format 'value(status.url)'
```

Your app is now live! 🎉

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 8080) |
| `NODE_ENV` | No | `production` or `development` |
| `FIREBASE_PROJECT_ID` | No | Firebase project ID for Firestore |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to service account key (local only) |

> **Note:** On Cloud Run, Application Default Credentials are automatic — no service account key file needed.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `EADDRINUSE` on port 8080 | Kill existing process: `npx kill-port 8080` |
| Frontend can't reach backend | Check CORS and `NEXT_PUBLIC_API_URL` env var |
| Firestore permission denied | Ensure service account has `Cloud Datastore User` role |
| Docker build fails at npm ci | Delete `package-lock.json` and regenerate |
