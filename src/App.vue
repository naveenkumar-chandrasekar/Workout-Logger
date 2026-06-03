<template>
  <AuthScreen
    v-if="appState === 'auth'"
    :loading="authLoading"
    :error="authError"
    @signin="handleSignIn"
    @change-setup="appState = 'setup'"
  />

  <div v-else-if="appState === 'loading'"
    style="height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:var(--surface);">
    <el-icon style="font-size:36px;color:var(--primary);animation:spin 1s linear infinite;"><Loading /></el-icon>
    <div style="font-size:14px;color:var(--text-3);">{{ loadingMsg }}</div>
  </div>

  <div v-else-if="appState === 'app'" class="app-layout">

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🏋️</span>
        <div class="logo-text">
          <div class="brand">Workout Logger</div>
          <div class="tagline">6-day split · {{ weightGoal }} kg goal</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-label">Overview</div>
        <button :class="['nav-item', { active: view === 'dashboard' }]"  @click="switchView('dashboard')">
          <span class="nav-icon">🏠</span><span>Dashboard</span>
        </button>

        <div class="sidebar-label">Training</div>
        <button :class="['nav-item', { active: view === 'plan' }]"       @click="switchView('plan')">
          <span class="nav-icon">📋</span><span>Weekly Plan</span>
        </button>
        <button :class="['nav-item', { active: view === 'log' }]"        @click="switchView('log')">
          <span class="nav-icon">💪</span><span>Log Workout</span>
          <span v-if="todaySessions > 0" class="nav-badge">{{ todaySessions }}</span>
        </button>
        <button :class="['nav-item', { active: view === 'history' }]"    @click="switchView('history')">
          <span class="nav-icon">📅</span><span>History</span>
          <span v-if="sessions.length" class="nav-badge">{{ sessions.length }}</span>
        </button>
        <button :class="['nav-item', { active: view === 'templates' }]"  @click="switchView('templates')">
          <span class="nav-icon">📄</span><span>Templates</span>
          <span v-if="templates.length" class="nav-badge">{{ templates.length }}</span>
        </button>

        <div class="sidebar-label">Health</div>
        <button :class="['nav-item', { active: view === 'bodyweight' }]" @click="switchView('bodyweight')">
          <span class="nav-icon">⚖️</span><span>Body Weight</span>
        </button>
        <button :class="['nav-item', { active: view === 'records' }]"    @click="switchView('records')">
          <span class="nav-icon">🏆</span><span>Personal Records</span>
        </button>
        <button :class="['nav-item', { active: view === 'analytics' }]"  @click="switchView('analytics')">
          <span class="nav-icon">📈</span><span>Analytics</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="drive-status">
          <div class="drive-dot" :style="{ background: driveConnected ? '#10b981' : '#f59e0b' }" />
          <div class="drive-info">
            <div class="drive-label">{{ driveConnected ? 'Google Drive' : 'Offline' }}</div>
            <div class="drive-sub">{{ driveConnected ? 'All data in Excel' : 'In-memory only' }}</div>
          </div>
        </div>

        <!-- Dark mode toggle -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(255,255,255,0.05); border-radius:var(--radius-sm); margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px;">{{ darkMode ? '🌙' : '☀️' }}</span>
            <span style="font-size:12px; font-weight:600; color:rgba(255,255,255,0.7);">{{ darkMode ? 'Dark mode' : 'Light mode' }}</span>
          </div>
          <el-switch v-model="darkMode" size="small" />
        </div>

        <el-dropdown @command="handleCmd" trigger="click" style="width:100%;">
          <button class="nav-item" style="width:100%;">
            <span class="nav-icon">⚙️</span><span>Settings</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sync"    :disabled="!driveConnected"><el-icon><Refresh /></el-icon> Sync Drive</el-dropdown-item>
              <el-dropdown-item command="export"  divided><el-icon><Download /></el-icon> Export Excel</el-dropdown-item>
              <el-dropdown-item command="signout" :disabled="!driveConnected" divided><el-icon><SwitchButton /></el-icon> Sign out</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <!-- ── Main area ── -->
    <div class="main-area">
      <header class="main-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <!-- Mobile hamburger -->
          <el-button
            class="mobile-header-btn"
            :icon="Menu"
            circle plain size="small"
            style="flex-shrink:0;"
            @click="mobileMenuOpen = true"
          />
          <div class="page-breadcrumb">
            <span class="crumb-active">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="header-actions">
          <el-tag v-if="saving" type="info" size="small" effect="plain">
            <el-icon style="animation:spin 1s linear infinite;"><Loading /></el-icon> Saving…
          </el-tag>
          <div style="font-size:13px;color:var(--text-3);">{{ currentDate }}</div>
        </div>
      </header>

      <main class="main-content">
        <Dashboard
          v-if="view === 'dashboard'"
          :plan="plan" :sessions="sessions"
          @go-log="switchView('log')"
          @go-history="switchView('history')"
          @edit-session="onEditSession"
          @start-day="switchView('log')"
        />
        <PlanView
          v-else-if="view === 'plan'"
          :plan="plan"
          @update-plan="onPlanUpdated"
        />
        <LogWorkout
          v-else-if="view === 'log'"
          :plan="plan" :sessions="sessions"
          :edit-session="editingSession"
          :preloaded-template="preloadedTemplate"
          @save="onSessionSaved"
          @cancel="editingSession = null; preloadedTemplate = null; activeLogSession = false"
          @template-consumed="preloadedTemplate = null"
          @save-template="onSaveTemplate"
          @session-changed="v => activeLogSession = v"
        />
        <WorkoutHistory
          v-else-if="view === 'history'"
          :sessions="sessions" :plan="plan" :body-weights="bodyWeights"
          @edit="onEditSession"
          @delete="onDeleteSession"
        />
        <Templates
          v-else-if="view === 'templates'"
          :model-value="templates" :plan="plan"
          @update:model-value="onTemplatesUpdated"
          @load-template="onLoadTemplate"
        />
        <BodyWeight
          v-else-if="view === 'bodyweight'"
          :model-value="bodyWeights"
          :goal="weightGoal"
          @update:model-value="onBodyWeightsUpdated"
          @update:goal="onGoalUpdated"
        />
        <PersonalRecords
          v-else-if="view === 'records'"
          :sessions="sessions" :plan="plan"
        />
        <Analytics
          v-else-if="view === 'analytics'"
          :sessions="sessions" :plan="plan"
        />
      </main>
    </div>

    <!-- ── Mobile bottom nav ── -->
    <nav class="mobile-nav">
      <button :class="['m-nav-item', { active: view === 'dashboard' }]"  @click="switchView('dashboard')">
        <span class="m-icon">🏠</span><span>Home</span>
      </button>
      <button :class="['m-nav-item', { active: view === 'plan' }]"       @click="switchView('plan')">
        <span class="m-icon">📋</span><span>Plan</span>
      </button>
      <button :class="['m-nav-item', { active: view === 'log' }]"        @click="switchView('log')">
        <span class="m-icon">💪</span><span>Log</span>
      </button>
      <button :class="['m-nav-item', { active: view === 'history' }]"    @click="switchView('history')">
        <span class="m-icon">📅</span><span>History</span>
      </button>
      <button class="m-nav-item" @click="mobileMenuOpen = true">
        <span class="m-icon">☰</span><span>More</span>
      </button>
    </nav>

    <!-- ── Mobile full-nav drawer ── -->
    <template v-if="mobileMenuOpen">
      <div class="mobile-menu-overlay" @click="mobileMenuOpen = false" />
      <div class="mobile-menu-panel">
        <div style="padding:0 16px 16px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:8px;">
          <div style="font-size:17px; font-weight:800; color:#fff;">🏋️ Workout Logger</div>
          <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:2px;">6-day split · {{ weightGoal }} kg</div>
        </div>
        <nav style="padding:0 8px; flex:1;">
          <div style="font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:1px; padding:10px 8px 4px;">Overview</div>
          <button v-for="item in allNavItems" :key="item.view"
            :class="['nav-item', { active: view === item.view }]"
            style="width:100%;"
            @click="switchView(item.view); mobileMenuOpen = false"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
        <div style="padding:12px 16px; border-top:1px solid rgba(255,255,255,0.08);">
          <div class="drive-status" style="margin-bottom:8px;">
            <div class="drive-dot" :style="{ background: driveConnected ? '#10b981' : '#f59e0b' }" />
            <div class="drive-info">
              <div class="drive-label">{{ driveConnected ? 'Google Drive' : 'Offline' }}</div>
            </div>
          </div>
          <button class="nav-item" style="width:100%;" @click="handleCmd('signout'); mobileMenuOpen = false" :disabled="!driveConnected">
            <span class="nav-icon">🚪</span><span>Sign out</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Refresh, SwitchButton, Key, Download, Menu } from '@element-plus/icons-vue';

import AuthScreen     from './components/AuthScreen.vue';
import Dashboard      from './components/Dashboard.vue';
import PlanView       from './components/PlanView.vue';
import LogWorkout     from './components/LogWorkout.vue';
import WorkoutHistory from './components/WorkoutHistory.vue';
import Templates      from './components/Templates.vue';
import BodyWeight     from './components/BodyWeight.vue';
import PersonalRecords from './components/PersonalRecords.vue';
import Analytics       from './components/Analytics.vue';

import { DEFAULT_PLAN, deepClone, today } from './data/workoutPlan.js';
import * as Drive from './services/googleDrive.js';
import {
  parseLogXlsx, buildLogXlsx,
  parsePlanXlsx, buildPlanXlsx,
  parseBodyWeightXlsx, buildBodyWeightXlsx,
  parseTemplatesXlsx, buildTemplatesXlsx,
} from './services/workoutData.js';
import { exportToExcel } from './composables/useExport.js';

// ── Session cache (sessionStorage) ────────────────────────────────────────
// Survives page refreshes, clears automatically when the tab is closed.
// Drive is always the source of truth; cache just avoids re-downloading on refresh.
const CACHE = 'wl_cache_';

function cacheWrite(key, data) {
  try { sessionStorage.setItem(CACHE + key, JSON.stringify(data)); } catch { /* quota */ }
}

function cacheRead(key) {
  try {
    const raw = sessionStorage.getItem(CACHE + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function cacheClear() {
  Object.keys(sessionStorage)
    .filter(k => k.startsWith(CACHE))
    .forEach(k => sessionStorage.removeItem(k));
}

function cacheIsFull() {
  return ['plan', 'log', 'weight', 'templates', 'driveIds']
    .every(k => sessionStorage.getItem(CACHE + k) !== null);
}

// ── App state ──────────────────────────────────────────────────────────────
const appState    = ref('setup');
const authLoading = ref(false);
const authError   = ref('');
const loadingMsg  = ref('Connecting…');
const driveConnected = ref(false);
const saving      = ref(false);

// ── Data — all in-memory, sourced from Drive Excel ─────────────────────────
const plan         = ref(deepClone(DEFAULT_PLAN));
const sessions     = ref([]);
const bodyWeights  = ref([]);
const weightGoal   = ref(74);
const templates    = ref([]);
const view              = ref('dashboard');
const editingSession    = ref(null);
const preloadedTemplate = ref(null);
const mobileMenuOpen    = ref(false);
const activeLogSession  = ref(false);
const darkMode          = ref(localStorage.getItem('wl_dark') === '1');

watch(darkMode, v => {
  document.documentElement.classList.toggle('dark', v);
  localStorage.setItem('wl_dark', v ? '1' : '0');
}, { immediate: true }); // true when Log Workout has unsaved data

const hasUnsavedSession = computed(() => view.value === 'log' && activeLogSession.value);

const allNavItems = [
  { view: 'dashboard',  icon: '🏠', label: 'Dashboard' },
  { view: 'plan',       icon: '📋', label: 'Weekly Plan' },
  { view: 'log',        icon: '💪', label: 'Log Workout' },
  { view: 'history',    icon: '📅', label: 'History' },
  { view: 'templates',  icon: '📄', label: 'Templates' },
  { view: 'bodyweight', icon: '⚖️', label: 'Body Weight' },
  { view: 'records',    icon: '🏆', label: 'Personal Records' },
  { view: 'analytics',  icon: '📈', label: 'Analytics' },
];

// ── Drive file IDs ─────────────────────────────────────────────────────────
const driveIds = { plan: null, log: null, weight: null, templates: null };

// ── Computed ───────────────────────────────────────────────────────────────
const pageTitle = computed(() => ({
  dashboard: 'Dashboard', plan: 'Weekly Plan', log: 'Log Workout',
  history: 'History', templates: 'Templates', bodyweight: 'Body Weight',
  records: 'Personal Records', analytics: 'Analytics',
}[view.value] || 'Dashboard'));

const currentDate = computed(() =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
);

const todaySessions = computed(() =>
  sessions.value.filter(s => s.date === today()).length
);

// ── Boot ───────────────────────────────────────────────────────────────────
// Client ID comes from the environment variable — set in .env.local for dev
// and in Vercel → Settings → Environment Variables for production.
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (clientId) boot(clientId);
else {
  // No client ID configured — show auth screen with an error
  authError.value = 'VITE_GOOGLE_CLIENT_ID is not set. Add it to .env.local or Vercel environment variables.';
  appState.value = 'auth';
}

async function boot(cid) {
  appState.value = 'loading';
  loadingMsg.value = 'Connecting to Google…';
  try {
    await Drive.initGapiClient();
    Drive.initGis(cid);

    if (localStorage.getItem('wl_signed_in') === '1') {
      loadingMsg.value = 'Restoring session…';

      // Restore the access token directly from sessionStorage — no GIS call,
      // no network, no popup whatsoever.
      if (Drive.restoreToken()) {
        driveConnected.value = true;

        if (cacheIsFull()) {
          // Best case: token valid + data cached → instant, nothing downloaded
          restoreFromCache();
          appState.value = 'app';
          return;
        }

        // Token valid but cache cold (e.g. first refresh or new tab)
        await loadAllFromDrive();
        appState.value = 'app';
        return;
      }

      // Token expired (>1 hour since last sign-in) → show sign-in screen.
      // We do NOT call requestToken here — that's what causes the popup.
      localStorage.removeItem('wl_signed_in');
      cacheClear();
      authError.value = 'Your session expired. Please sign in again.';
    }

    appState.value = 'auth';
  } catch (e) {
    console.warn('Drive init failed, going offline:', e.message);
    appState.value = 'app';
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────

function goOffline() {
  driveConnected.value = false;
  appState.value = 'app';
  ElMessage.warning('Running offline — data will not be saved between sessions');
}

async function handleSignIn() {
  authLoading.value = true;
  authError.value   = '';
  try {
    await Drive.requestToken(); // shows popup once; token saved inside
    localStorage.setItem('wl_signed_in', '1');
    driveConnected.value = true;
    await loadAllFromDrive();
    appState.value = 'app';
  } catch (e) {
    authError.value = e.message || 'Sign-in failed';
  } finally {
    authLoading.value = false;
  }
}

// ── Load all Drive files ───────────────────────────────────────────────────
async function loadAllFromDrive() {
  appState.value = 'loading';

  const files = [
    { key: 'plan',      name: 'workout_plan.xlsx' },
    { key: 'log',       name: 'workout_log.xlsx' },
    { key: 'weight',    name: 'body_weight.xlsx' },
    { key: 'templates', name: 'workout_templates.xlsx' },
  ];

  for (const f of files) {
    loadingMsg.value = `Loading ${f.name}…`;
    try {
      let file = await Drive.findFileByName(f.name);

      if (!file) {
        // Create file with default data
        const data = getDefaultFileData(f.key);
        file = await Drive.createFile(f.name, new Uint8Array(data));
      }

      driveIds[f.key] = file.id;
      const buf = await Drive.downloadFile(file.id);
      parseAndStore(f.key, buf);
    } catch (e) {
      if (isSessionExpired(e)) { forceSignOut(true); return; }
      ElMessage.error(`Failed to load ${f.name}: ${e.message}`);
    }
  }
}

function getDefaultFileData(key) {
  if (key === 'plan')      return buildPlanXlsx(plan.value);
  if (key === 'log')       return buildLogXlsx([]);
  if (key === 'weight')    return buildBodyWeightXlsx([], weightGoal.value);
  if (key === 'templates') return buildTemplatesXlsx([]);
  return [];
}

function parseAndStore(key, buf) {
  if (key === 'plan') {
    const parsed = parsePlanXlsx(buf);
    if (parsed) { plan.value = parsed; cacheWrite('plan', parsed); }
  } else if (key === 'log') {
    const s = parseLogXlsx(buf);
    sessions.value = s;
    cacheWrite('log', s);
  } else if (key === 'weight') {
    const { weights, goal } = parseBodyWeightXlsx(buf);
    bodyWeights.value = weights;
    weightGoal.value  = goal;
    cacheWrite('weight', { weights, goal });
  } else if (key === 'templates') {
    const t = parseTemplatesXlsx(buf);
    templates.value = t;
    cacheWrite('templates', t);
  }
  // persist drive file IDs so cache knows where to save
  cacheWrite('driveIds', driveIds);
}

function restoreFromCache() {
  const cachedPlan = cacheRead('plan');
  if (cachedPlan) plan.value = cachedPlan;

  const cachedLog = cacheRead('log');
  if (cachedLog) sessions.value = cachedLog;

  const cachedWeight = cacheRead('weight');
  if (cachedWeight) { bodyWeights.value = cachedWeight.weights; weightGoal.value = cachedWeight.goal; }

  const cachedTemplates = cacheRead('templates');
  if (cachedTemplates) templates.value = cachedTemplates;

  const cachedIds = cacheRead('driveIds');
  if (cachedIds) Object.assign(driveIds, cachedIds);
}

// ── Save to Drive ──────────────────────────────────────────────────────────
async function saveToDrive(key, data) {
  if (!driveConnected.value) return;
  saving.value = true;
  try {
    const names = { plan: 'workout_plan.xlsx', log: 'workout_log.xlsx', weight: 'body_weight.xlsx', templates: 'workout_templates.xlsx' };
    if (!driveIds[key]) {
      const file = await Drive.createFile(names[key], new Uint8Array(data));
      driveIds[key] = file.id;
      cacheWrite('driveIds', driveIds);
    } else {
      await Drive.updateFile(driveIds[key], new Uint8Array(data));
    }
  } catch (e) {
    if (isSessionExpired(e)) {
      forceSignOut(true);
    } else {
      ElMessage.error('Drive save failed: ' + e.message);
    }
  } finally {
    saving.value = false;
  }
}

function isSessionExpired(err) {
  const msg = err?.message || '';
  return msg.includes('401') || msg.includes('403') || msg.includes('invalid_token') || msg.includes('Token has been expired');
}

// ── Event handlers ─────────────────────────────────────────────────────────
function switchView(v) {
  // Warn if navigating away from an active unsaved session
  if (v !== 'log' && view.value === 'log' && hasUnsavedSession.value) {
    ElMessageBox.confirm(
      'You have an active session with unsaved data. Leave without saving?',
      'Unsaved Session',
      {
        confirmButtonText: 'Leave',
        cancelButtonText: 'Stay & Save',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    ).then(() => {
      // User confirmed leave
      editingSession.value = null;
      preloadedTemplate.value = null;
      view.value = v;
    }).catch(() => {
      // User chose to stay — do nothing
    });
    return;
  }
  if (v !== 'log') { editingSession.value = null; preloadedTemplate.value = null; }
  view.value = v;
}

async function onPlanUpdated(newPlan) {
  plan.value = newPlan;
  cacheWrite('plan', newPlan);
  await saveToDrive('plan', buildPlanXlsx(newPlan));
  ElMessage.success('Plan saved');
}

async function onSessionSaved(session) {
  const idx = sessions.value.findIndex(s => s.id === session.id);
  const updated = [...sessions.value];
  if (idx >= 0) updated[idx] = session; else updated.push(session);
  sessions.value = updated;
  editingSession.value = null;
  cacheWrite('log', updated);
  await saveToDrive('log', buildLogXlsx(updated));
}

async function onDeleteSession(id) {
  const updated = sessions.value.filter(s => s.id !== id);
  sessions.value = updated;
  cacheWrite('log', updated);
  await saveToDrive('log', buildLogXlsx(updated));
  ElMessage.success('Session deleted');
}

function onEditSession(session) {
  editingSession.value = deepClone(session);
  view.value = 'log';
}

async function onBodyWeightsUpdated(updated) {
  bodyWeights.value = updated;
  cacheWrite('weight', { weights: updated, goal: weightGoal.value });
  await saveToDrive('weight', buildBodyWeightXlsx(updated, weightGoal.value));
}

async function onGoalUpdated(newGoal) {
  weightGoal.value = newGoal;
  cacheWrite('weight', { weights: bodyWeights.value, goal: newGoal });
  await saveToDrive('weight', buildBodyWeightXlsx(bodyWeights.value, newGoal));
}

async function onTemplatesUpdated(updated) {
  templates.value = updated;
  cacheWrite('templates', updated);
  await saveToDrive('templates', buildTemplatesXlsx(updated));
}

function onLoadTemplate(tpl) {
  preloadedTemplate.value = tpl;
  view.value = 'log';
}

async function onSaveTemplate(tplData) {
  const newTpl = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
    name:      tplData.name,
    exercises: tplData.exercises,
    muscles:   [...new Set(tplData.exercises.map(e => e.muscle).filter(Boolean))],
    createdAt: today(),
    usedCount: 0,
  };
  const updated = [...templates.value, newTpl];
  templates.value = updated;
  cacheWrite('templates', updated);
  await saveToDrive('templates', buildTemplatesXlsx(updated));
}

async function handleCmd(cmd) {
  if (cmd === 'sync') {
    cacheClear(); // force re-download from Drive
    ElMessage.info('Syncing from Drive…');
    await loadAllFromDrive();
    appState.value = 'app';
    ElMessage.success('Synced!');
  } else if (cmd === 'export') {
    exportToExcel({ sessions: sessions.value, bodyWeights: bodyWeights.value, dateFrom: null, dateTo: null });
  } else if (cmd === 'signout') {
    forceSignOut();
  } else if (cmd === 'setup') {
    appState.value = 'setup';
  }
}

function forceSignOut(expired = false) {
  Drive.signOut(); // also calls clearStoredToken() inside
  localStorage.removeItem('wl_signed_in');
  cacheClear();
  driveConnected.value = false;
  // clear in-memory data
  plan.value        = deepClone(DEFAULT_PLAN);
  sessions.value    = [];
  bodyWeights.value = [];
  templates.value   = [];
  weightGoal.value  = 74;
  if (expired) {
    ElMessage.warning({ message: 'Your session expired. Please sign in again.', duration: 4000 });
  } else {
    ElMessage.info('Signed out');
  }
  appState.value = 'auth';
}
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
