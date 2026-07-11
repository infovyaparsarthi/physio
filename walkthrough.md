# Connection & Startup Walkthrough

We have successfully configured, installed, connected, and started both the frontend and server projects.

## What Was Done

### 1. Database Setup
- Discovered that the local **PostgreSQL 18** service (`postgresql-x64-18`) was running on port `5432`.
- Programmatically determined local credentials to be:
  - **User**: `postgres`
  - **Password**: `root`
- Created the database `clinic_attendance` for the application.

### 2. Backend Config & Setup
- Installed dependencies in the [server](file:///e:/clinic_attendance/server) directory.
- Created the `.env` file with configuration matching the local database and a secure generated `JWT_SECRET`.
- Executed the database schema migration from [server/db/schema.sql](file:///e:/clinic_attendance/server/db/schema.sql) successfully.
- Seeded the default administrator user:
  - **Username**: `admin`
  - **Password**: `physio123`

### 3. Frontend Config & Setup
- Installed dependencies in the [frontend](file:///e:/clinic_attendance/frontend) directory.
- Created the `.env` file referencing the backend endpoint: `VITE_API_URL=http://localhost:3001`.

### 4. Running the Development Servers
- Launched the Express API backend in development mode (running on port `3001`).
- Launched the Vite React frontend development server (running on port `5173`).

---

## Verification Results

- **Backend Health Check**:
  Querying `http://localhost:3001/health` returns `ok: true`, indicating the Express server is running and can query PostgreSQL successfully.
- **Frontend Server**:
  Vite is active at `http://localhost:5173/` and successfully fetches configuration pointing to port `3001`.

---

## Running Commands Reference
Both services are currently running in the background. To manually start them in the future:

1. **Start Backend**:
   ```bash
   cd server
   npm run dev
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```


<!-- ----- -->
