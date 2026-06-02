# 🏋️ Workout Logger

A personal workout tracking web app built with **Vue 3 + Element Plus**, deployed on **Vercel**, and synced to **Google Drive** as Excel files — no backend, no database.

---

## Features

| Page | What it does |
|------|-------------|
| **Dashboard** | Streak counter, weekly activity grid, 30-day heatmap, today's suggested workout, muscle frequency |
| **Weekly Plan** | View and edit your 6-day split — add/remove exercises, change sets/reps/muscle targets |
| **Log Workout** | Select a day or create a custom workout, log sets with reps + weight, live PR detection, cardio |
| **History** | Full session history in a data table, expandable set details, delete/edit sessions |
| **Personal Records** | Auto-detected best weight & reps per exercise, sparkline trend charts, history drawer |
| **Body Weight** | Daily weight log, trend chart with goal line, 7-day and 30-day rolling averages |
| **Templates** | Save any session as a reusable template, load into Log Workout in one click |
| **Export** | Download full history as a formatted Excel file (Sessions, Sets, Cardio, Body Weight sheets) |

---

## Tech Stack

- **Vue 3** — Composition API (`<script setup>`)
- **Element Plus** — UI component library
- **Vite** — build tool
- **SheetJS (xlsx)** — read/write Excel files
- **Google Drive API** — file storage (via GIS OAuth2)
- **Chart.js** — weight trend and PR history charts

---

## Data Storage

All data lives in **4 Excel files on your Google Drive** — nothing is stored in a database or server.

| File | Contents |
|------|----------|
| `workout_plan.xlsx` | Your 6-day plan (editable in-app) |
| `workout_log.xlsx` | All logged sessions and sets |
| `body_weight.xlsx` | Daily weight entries + goal setting |
| `workout_templates.xlsx` | Saved workout templates |

> The app reads these files on sign-in, caches them in `sessionStorage` for instant refresh, and writes back to Drive on every save.

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-username/Workout-Logger.git
cd Workout-Logger
npm install
```

### 2. Google OAuth — get a Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Enable APIs** → enable **Google Drive API**
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add these to **Authorized JavaScript origins**:
   - `http://localhost:5173` (local dev)
   - `https://your-app.vercel.app` (production)
6. Copy the **Client ID**

### 3. Configure environment

Create a `.env.local` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> `.env.local` is in `.gitignore` — never commit your Client ID.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), sign in with Google, and the app creates the Excel files in your Drive automatically.

---

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com) — framework is auto-detected as Vite
3. Go to **Settings → Environment Variables** → add:
   ```
   VITE_GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
   ```
4. Redeploy — done

---

## Session & Auth Behaviour

| Scenario | Behaviour |
|----------|-----------|
| First visit | Sign in with Google (one-time consent) |
| Page refresh (token valid) | Restored silently from `sessionStorage` — no popup |
| New tab | Token restored, data re-fetched from Drive |
| Token expired (>1 hr) | Redirected to sign-in screen automatically |
| Sign out | Token revoked, cache cleared, data wiped from memory |

---

## Project Structure

```
src/
├── components/
│   ├── AuthScreen.vue        # Google sign-in screen
│   ├── Dashboard.vue         # Overview with streak + activity
│   ├── PlanView.vue          # 6-day plan viewer + editor
│   ├── LogWorkout.vue        # Session logging with live PR badges
│   ├── WorkoutHistory.vue    # History table with export
│   ├── PersonalRecords.vue   # Auto-detected PRs with charts
│   ├── BodyWeight.vue        # Weight tracker with trend chart
│   └── Templates.vue         # Workout template library
├── composables/
│   ├── usePRs.js             # PR computation + detection logic
│   └── useExport.js          # Excel export helper
├── data/
│   └── workoutPlan.js        # Default 6-day plan (74 kg personalised)
├── services/
│   ├── googleDrive.js        # OAuth2 + Drive API calls
│   └── workoutData.js        # xlsx parse/build for all 4 files
├── App.vue                   # Root — auth flow, state, Drive sync
└── index.css                 # Global styles + responsive breakpoints
```

---

## Workout Plan

A 6-day split is set up and ready to go from the moment you sign in — no manual entry needed to get started.

| Day | Focus |
|-----|-------|
| Day 1 | Chest · Shoulder · Triceps |
| Day 2 | Back · Biceps · Legs |
| Day 3 | Chest · Shoulder · Biceps · Triceps |
| Day 4 | Back · Biceps · Legs |
| Day 5 | Chest · Shoulder · Triceps |
| Day 6 | Back · Biceps · Legs |
| Day 7 | Rest |

Everything is fully editable in the Plan page — swap exercises, adjust sets and reps, change the order, or add your own.

---

## License

Personal use. Not intended for public distribution.
