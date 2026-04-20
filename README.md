# My Orbit - Personal Operations Dashboard

My Orbit is a comprehensive personal operations dashboard designed to help you manage your daily life, from shopping lists and bills to document storage and task tracking.

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios.
- **Backend**: FastAPI (Python 3.11), SQLModel (SQLAlchemy + Pydantic), Firebase Admin SDK.
- **Database**:
  - **Local**: SQLite (`myorbit.db`)
  - **Production**: Google Cloud SQL (PostgreSQL)
- **Authentication**: Firebase Authentication.
- **Hosting**:
  - **Frontend**: Firebase Hosting.
  - **Backend**: Google Cloud Run.
- **Infrastructure**: Turborepo (Monorepo), GitHub Actions (CI/CD).

---

## 🛠️ Local Development

### Prerequisites
- Node.js (>= 18)
- pnpm (>= 9)
- Python 3.11+

### 1. Setup

Clone the repository and install dependencies:

```bash
# Install root and workspace dependencies
pnpm install

# Setup backend virtual environment
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .
```

### 2. Environment Variables

Create a `.env` file in `apps/web/` for the frontend:
```env
VITE_API_URL=http://localhost:8000
# Add your Firebase client config here
```

### 3. Running the Apps

You can run everything from the root using Turbo:

```bash
# Run both frontend and backend in development mode
pnpm run dev
```

Or run them individually:

```bash
# Frontend only
pnpm --filter web dev

# Backend only
pnpm --filter @repo/api dev
```

---

## 🧪 Testing & Linting

### Linting
```bash
pnpm run lint
```

### Type Checking
```bash
pnpm run check-types
```

### Unit Tests
Currently, tests can be run using standard tools in their respective directories:
- **Frontend**: `pnpm --filter web test` (if configured)
- **Backend**: `pytest` in `apps/api`

---

## ☁️ Deployment

### Automated Deployment (CI/CD)
Pushing to the `main` branch triggers the GitHub Action workflow defined in `.github/workflows/deploy.yml`.

**Required GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT_MY_ORBIT_APP_F2A73`: Firebase Service Account JSON.
- `GCP_SA_KEY`: Google Cloud Service Account JSON with Cloud Run and GCR permissions.
- `DATABASE_URL`: Production PostgreSQL connection string.
- `VITE_API_URL`: The URL of your deployed Cloud Run service.

### Manual Backend Deployment (Cloud Run)
```bash
cd apps/api
gcloud run deploy my-orbit-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances my-orbit-app-f2a73:us-central1:my-orbit-app \
  --update-env-vars DATABASE_URL="your-db-connection-string"
```

### Manual Frontend Deployment (Firebase)
```bash
pnpm run build
firebase deploy --only hosting
```

---

## 📂 Project Structure

- `apps/web`: React frontend application.
- `apps/api`: FastAPI backend application.
- `packages/ui`: Shared React component library.
- `packages/typescript-config`: Shared TypeScript configurations.
- `packages/eslint-config`: Shared ESLint configurations.
