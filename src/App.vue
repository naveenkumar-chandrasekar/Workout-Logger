<template>
  <SetupScreen v-if="appState === 'setup'" @save="onClientIdSaved" @skip="goOffline" />

  <AuthScreen
    v-else-if="appState === 'auth'"
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
      </nav>

      <div class="sidebar-footer">
        <div class="drive-status">
          <div class="drive-dot" :style="{ background: driveConnected ? '#10b981' : '#f59e0b' }" />
          <div class="drive-info">
            <div class="drive-label">{{ driveConnected ? 'Google Drive' : 'Offline' }}</div>
            <div class="drive-sub">{{ driveConnected ? 'All data in Excel' : 'In-memory only' }}</div>
          </div>
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
              <el-dropdown-item command="setup"   divided><el-icon><Key /></el-icon> Change Client ID</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <!-- ── Main area ── -->
    <div class="main-area">
      <header class="main-header">
        <div class="page-breadcrumb">
          <span>Workspace</span>
          <span style="color:var(--border);">/</span>
          <span class="crumb-active">{{ pageTitle }}</span>
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
          @cancel="editingSession = null; preloadedTemplate = null"
          @template-consumed="preloadedTemplate = null"
          @save-template="onSaveTemplate"
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
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, Refresh, SwitchButton, Key, Download } from '@element-plus/icons-vue';

import SetupScreen    from './components/SetupScreen.vue';
import AuthScreen     from './components/AuthScreen.vue';
import Dashboard      from './components/Dashboard.vue';
import PlanView       from './components/PlanView.vue';
import LogWorkout     from './components/LogWorkout.vue';
import WorkoutHistory from './components/WorkoutHistory.vue';
import Templates      from './components/Templates.vue';
import BodyWeight     from './components/BodyWeight.vue';
import PersonalRecords from './components/PersonalRecords.vue';

import { DEFAULT_PLAN, deepClone, today } from './data/workoutPlan.js';
import * as Drive from './services/googleDrive.js';
import {
  parseLogXlsx, buildLogXlsx,
  parsePlanXlsx, buildPlanXlsx,
  parseBodyWeightXlsx, buildBodyWeightXlsx,
  parseTemplatesXlsx, buildTemplatesXlsx,
} from './services/workoutData.js';
import { exportToExcel } from './composables/useExport.js';

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
const view         = ref('dashboard');
const editingSession    = ref(null);
const preloadedTemplate = ref(null);

// ── Drive file IDs ─────────────────────────────────────────────────────────
const driveIds = { plan: null, log: null, weight: null, templates: null };

// ── Computed ───────────────────────────────────────────────────────────────
const pageTitle = computed(() => ({
  dashboard: 'Dashboard', plan: 'Weekly Plan', log: 'Log Workout',
  history: 'History', templates: 'Templates', bodyweight: 'Body Weight',
  records: 'Personal Records',
}[view.value] || 'Dashboard'));

const currentDate = computed(() =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
);

const todaySessions = computed(() =>
  sessions.value.filter(s => s.date === today()).length
);

// ── Boot ───────────────────────────────────────────────────────────────────
// Only the OAuth client ID lives in localStorage — it's configuration, not data
const clientId = localStorage.getItem('wl_clientId');
if (clientId) boot(clientId);
else appState.value = 'setup';

async function boot(cid) {
  appState.value = 'loading';
  loadingMsg.value = 'Initialising Google APIs…';
  try {
    await Drive.initGapiClient();
    Drive.initGis(cid);
    appState.value = 'auth';
  } catch (e) {
    console.warn('Drive init failed, going offline:', e.message);
    appState.value = 'app';
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────
function onClientIdSaved(cid) { boot(cid); }

function goOffline() {
  driveConnected.value = false;
  appState.value = 'app';
  ElMessage.warning('Running offline — data will not be saved between sessions');
}

async function handleSignIn() {
  authLoading.value = true;
  authError.value   = '';
  try {
    await Drive.requestToken();
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
    if (parsed) plan.value = parsed;
  } else if (key === 'log') {
    sessions.value = parseLogXlsx(buf);
  } else if (key === 'weight') {
    const { weights, goal } = parseBodyWeightXlsx(buf);
    bodyWeights.value = weights;
    weightGoal.value  = goal;
  } else if (key === 'templates') {
    templates.value = parseTemplatesXlsx(buf);
  }
}

// ── Save to Drive ──────────────────────────────────────────────────────────
async function saveToDrive(key, data) {
  if (!driveConnected.value) return;
  saving.value = true;
  try {
    if (!driveIds[key]) {
      const names = { plan: 'workout_plan.xlsx', log: 'workout_log.xlsx', weight: 'body_weight.xlsx', templates: 'workout_templates.xlsx' };
      const file = await Drive.createFile(names[key], new Uint8Array(data));
      driveIds[key] = file.id;
    } else {
      await Drive.updateFile(driveIds[key], new Uint8Array(data));
    }
  } catch (e) {
    ElMessage.error('Drive save failed: ' + e.message);
  } finally {
    saving.value = false;
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────
function switchView(v) {
  if (v !== 'log') { editingSession.value = null; preloadedTemplate.value = null; }
  view.value = v;
}

async function onPlanUpdated(newPlan) {
  plan.value = newPlan;
  await saveToDrive('plan', buildPlanXlsx(newPlan));
  ElMessage.success('Plan saved to Drive');
}

async function onSessionSaved(session) {
  const idx = sessions.value.findIndex(s => s.id === session.id);
  const updated = [...sessions.value];
  if (idx >= 0) updated[idx] = session; else updated.push(session);
  sessions.value = updated;
  editingSession.value = null;
  await saveToDrive('log', buildLogXlsx(updated));
}

async function onDeleteSession(id) {
  const updated = sessions.value.filter(s => s.id !== id);
  sessions.value = updated;
  await saveToDrive('log', buildLogXlsx(updated));
  ElMessage.success('Session deleted');
}

function onEditSession(session) {
  editingSession.value = deepClone(session);
  view.value = 'log';
}

async function onBodyWeightsUpdated(updated) {
  bodyWeights.value = updated;
  await saveToDrive('weight', buildBodyWeightXlsx(updated, weightGoal.value));
}

async function onGoalUpdated(newGoal) {
  weightGoal.value = newGoal;
  await saveToDrive('weight', buildBodyWeightXlsx(bodyWeights.value, newGoal));
}

async function onTemplatesUpdated(updated) {
  templates.value = updated;
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
  await saveToDrive('templates', buildTemplatesXlsx(updated));
}

async function handleCmd(cmd) {
  if (cmd === 'sync') {
    ElMessage.info('Syncing…');
    await loadAllFromDrive();
    appState.value = 'app';
    ElMessage.success('Synced from Drive!');
  } else if (cmd === 'export') {
    exportToExcel({ sessions: sessions.value, bodyWeights: bodyWeights.value, dateFrom: null, dateTo: null });
  } else if (cmd === 'signout') {
    Drive.signOut();
    driveConnected.value = false;
    plan.value     = deepClone(DEFAULT_PLAN);
    sessions.value = [];
    bodyWeights.value = [];
    templates.value   = [];
    weightGoal.value  = 74;
    ElMessage.info('Signed out — data cleared from memory');
  } else if (cmd === 'setup') {
    appState.value = 'setup';
  }
}
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
