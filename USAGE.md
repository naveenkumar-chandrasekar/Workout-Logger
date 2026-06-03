# How to Use Workout Logger

A personal workout tracking app that syncs everything to your Google Drive as Excel files. No accounts, no subscriptions — just your data in your Drive.

---

## First-Time Setup

### 1. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Framework auto-detects as **Vite** — click Deploy

### 2. Set Up Google OAuth

You need a Google Client ID so the app can read/write files in your Drive.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (name it anything)
3. **APIs & Services → Enable APIs** → search and enable **Google Drive API**
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Under **Authorized JavaScript origins**, add:
   - `https://your-app.vercel.app` (your Vercel URL)
   - `http://localhost:5173` (for local development)
7. Copy the **Client ID**

### 3. Add the Client ID to Vercel

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add:
   ```
   Name:  VITE_GOOGLE_CLIENT_ID
   Value: your-client-id.apps.googleusercontent.com
   ```
3. Redeploy

### 4. First Sign-In

1. Open your Vercel URL
2. Click **Sign in with Google**
3. Grant Drive access — you'll see a warning ("app not verified") since it's your own personal app — click **Continue**
4. The app creates 4 Excel files in your Google Drive automatically:
   - `workout_plan.xlsx` — your 6-day plan
   - `workout_log.xlsx` — all your sessions
   - `body_weight.xlsx` — weight entries
   - `workout_templates.xlsx` — saved templates

---

## Day-to-Day Usage

### Logging a Workout

1. Go to **Log Workout** in the sidebar
2. Pick today's date and select a day (Day 1–6) or **Custom**
3. Hit **Start Logging**
4. For each exercise:
   - Expand it by clicking the row
   - Enter **reps** and **weight (kg)** for each set
   - A 🏆 badge appears automatically when you beat a personal record
   - Add more sets with **Add Set**, remove with ✕
5. Toggle **Cardio** if you did treadmill, jogging, or cycling
6. Add a note if you want (PRs, how it felt, etc.)
7. Click **✓ Save Workout** — saved to Drive instantly

### Editing the Plan

1. Go to **Weekly Plan**
2. Click **Edit** on any day
3. Add or remove exercises, change sets/reps, rename, reorder
4. Hit **Save Changes** — updates `workout_plan.xlsx` in Drive

### Tracking Body Weight

1. Go to **Body Weight**
2. Enter the date, time (you can log multiple times a day), and your weight
3. Set your **target weight** in the log panel
4. The trend chart and rolling averages update automatically

### Personal Records

Go to **Personal Records** — the app automatically finds your best weight and best reps for every exercise from your logged sessions. No manual entry needed. Click any exercise to see its full history chart.

### Templates

- **Save a session as a template:** while logging, click **📄 Save as Template** in the session header
- **Create from scratch:** go to **Templates → New Template**
- **Use a template:** click **Use Template →** on any card — it loads directly into Log Workout

### Exporting Data

- **History page:** click **Export Excel** to download a formatted spreadsheet with all sessions, sets, cardio, and body weight on separate sheets
- **Sidebar → Settings → Export Excel** for a quick full export

---

## Tips

- **Refresh without re-login:** the app caches your session — page refreshes are instant with no popup as long as your Google token is valid (~1 hour)
- **After 1 hour:** you'll see "Session expired" and need to sign in once — takes 2 seconds
- **Add to home screen (Android):** open in Chrome → 3-dot menu → Add to Home Screen — opens like a native app
- **Resetting the plan:** delete `workout_plan.xlsx` from your Google Drive and refresh — the app recreates it with the default 6-day plan
- **Your logs are always safe:** workout logs, body weight, and templates are in separate files from the plan — deleting/resetting the plan never touches your history

---

## Running Locally

```bash
git clone https://github.com/your-username/Workout-Logger.git
cd Workout-Logger
npm install

# Create .env.local and add your Client ID
echo "VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" > .env.local

npm run dev
# Open http://localhost:5173
```
