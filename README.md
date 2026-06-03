# 🏋️ Workout Logger

A personal workout tracking web app built with **Vue 3 + Element Plus**, deployed on **Vercel**, and synced to **Google Drive** as Excel files — no backend, no database, no subscriptions.

---

## Features

| Page | What it does |
|------|-------------|
| **Dashboard** | Streak counter, weekly activity grid, 30-day heatmap, today's suggested workout, muscle frequency, milestone badges |
| **Weekly Plan** | View and edit your 6-day split — add/remove exercises, change sets/reps/muscle targets, drag to reorder |
| **Log Workout** | Select a day or create a custom workout, log sets with reps + weight, live PR detection, cardio, drag to reorder exercises |
| **Calendar** | Monthly calendar with colour-coded session dots, click any day to see full session detail |
| **History** | Full session history table, search by exercise name, filter by day, expandable set details, delete/edit |
| **Personal Records** | Auto-detected best weight & reps per exercise, sparkline trend charts, history drawer with Chart.js |
| **Body Weight** | Daily weight log with time support (multiple entries per day), trend chart, goal setting |
| **Templates** | Save any session as a reusable template, load into Log Workout in one click |
| **Export** | Download full history as Excel with Sessions, Sets, Cardio, Body Weight sheets + date filter |

### Additional capabilities
- **Dark mode** — toggle in the sidebar, persists across sessions
- **Milestone badges** — auto-awarded on the dashboard for streaks, PRs, sessions count, full weeks
- **Drag to reorder** — exercises in Log Workout and Plan Edit (mouse + touch)
- **Unsaved changes warning** — alerts before navigating away from an active session
- **History search** — filter sessions by exercise name with highlighted matches

---

## Tech Stack

- **Vue 3** — Composition API (`<script setup>`)
- **Element Plus** — UI component library
- **Vite** — build tool
- **SheetJS (xlsx)** — read/write Excel files
- **Google Drive API** — file storage via GIS OAuth2
- **Chart.js** — weight trend and PR history charts

---

## Data Storage

All data lives in **4 Excel files on your Google Drive**. Nothing is stored in a database or server.

| File | Contents |
|------|----------|
| `workout_plan.xlsx` | Your 6-day plan (editable in-app) |
| `workout_log.xlsx` | All logged sessions and sets |
| `body_weight.xlsx` | Daily weight entries + goal setting |
| `workout_templates.xlsx` | Saved workout templates |

> The app caches data in `sessionStorage` — page refreshes are instant with no network call. Drive is only hit on first load per browser session or when you manually sync.

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
3. **Credentials → Create → OAuth 2.0 Client ID** — type: **Web application**
4. Add to **Authorized JavaScript origins**:
   - `http://localhost:5173` (local dev)
   - `https://your-app.vercel.app` (production)
5. Copy the **Client ID**

### 3. Configure environment

```bash
# Create .env.local (never commit this file)
echo "VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" > .env.local
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:5173
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com) — framework auto-detected as Vite
3. **Settings → Environment Variables** → add `VITE_GOOGLE_CLIENT_ID`
4. Redeploy

---

## Session & Auth

| Scenario | Behaviour |
|----------|-----------|
| First visit | Sign in with Google — one-time consent |
| Refresh (within ~1 hr) | Token restored silently from `sessionStorage` — no popup |
| Token expired | Redirected to sign-in screen with "session expired" message |
| Sign out | Token revoked, cache cleared |

---

## Day-to-Day Usage

### Logging a workout
1. **Log Workout** → pick date + day → **Start Logging**
2. Expand each exercise → enter reps + weight per set
3. A 🏆 badge appears live when you beat a personal record
4. Toggle cardio (treadmill / jogging / cycling) if applicable
5. **✓ Save Workout** — synced to Drive immediately

### Editing the plan
**Weekly Plan** → **Edit** on any day → add/remove/reorder exercises → **Save Changes**

### Body weight
**Body Weight** → enter date, time, weight → **Save Entry**. Multiple entries per day supported (morning, post-workout, evening).

### Templates
- Save a session: tap **📄 Save as Template** in the session header while logging
- Load a template: **Templates** → **Use Template →**

### Exporting
**History** → **Export Excel** → set optional date range → **Download Excel**

---

## Tips

- **Add to home screen (Android/iOS):** open in Chrome/Safari → share menu → Add to Home Screen → opens like a native app
- **Resetting the plan:** delete `workout_plan.xlsx` from Google Drive — the app recreates it with defaults on next load. Your logs are in a separate file and are not affected.
- **Dark mode:** toggle the ☀️/🌙 switch in the sidebar footer
- **Drag to reorder:** grab the `⠿` handle on any exercise to reorder it
- **Search history:** use the search bar in History to find all sessions containing a specific exercise

---

## Project Structure

```
src/
├── components/
│   ├── AuthScreen.vue         Sign-in screen
│   ├── Dashboard.vue          Overview, streak, heatmap, badges
│   ├── PlanView.vue           6-day plan viewer + editor
│   ├── LogWorkout.vue         Session logging with live PR detection
│   ├── CalendarView.vue       Monthly training calendar
│   ├── WorkoutHistory.vue     History table with search + export
│   ├── PersonalRecords.vue    Auto-detected PRs with charts
│   ├── BodyWeight.vue         Weight tracker with trend chart
│   └── Templates.vue          Workout template library
├── composables/
│   ├── usePRs.js              PR computation + live detection
│   ├── useDragSort.js         Drag-to-reorder (mouse + touch)
│   └── useExport.js           Excel export helper
├── data/
│   └── workoutPlan.js         Default 6-day plan + helpers
├── services/
│   ├── googleDrive.js         OAuth2 + Drive API calls
│   └── workoutData.js         xlsx parse/build for all 4 files
├── App.vue                    Root — auth, state, Drive sync, routing
└── index.css                  Global styles + dark mode + responsive
```

---

## License

Personal use.
