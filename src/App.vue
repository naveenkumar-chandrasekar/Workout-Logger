<template>
  <!-- Setup screen -->
  <SetupScreen v-if="appState === 'setup'" @save="onClientIdSaved" @skip="goOffline" />

  <!-- Auth screen -->
  <AuthScreen
    v-else-if="appState === 'auth'"
    :loading="authLoading"
    :error="authError"
    @signin="handleSignIn"
    @change-setup="appState = 'setup'"
  />

  <!-- Loading -->
  <div v-else-if="appState === 'loading'"
    style="height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:14px; background:var(--surface);">
    <el-icon style="font-size:36px; color:var(--primary); animation:spin 1s linear infinite;"><Loading /></el-icon>
    <div style="font-size:14px; color:var(--text-3);">{{ loadingMsg }}</div>
  </div>

  <!-- Main app -->
  <div v-else-if="appState === 'app'" class="app-layout">

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-icon">🏋️</span>
        <div class="logo-text">
          <div class="brand">Workout Logger</div>
          <div class="tagline">6-day split · 74 kg</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="sidebar-label">Overview</div>

        <button :class="['nav-item', { active: view === 'dashboard' }]" @click="switchView('dashboard')">
          <span class="nav-icon">🏠</span>
          <span>Dashboard</span>
        </button>

        <div class="sidebar-label">Training</div>

        <button :class="['nav-item', { active: view === 'plan' }]" @click="switchView('plan')">
          <span class="nav-icon">📋</span>
          <span>Weekly Plan</span>
        </button>

        <button :class="['nav-item', { active: view === 'log' }]" @click="switchView('log')">
          <span class="nav-icon">💪</span>
          <span>Log Workout</span>
          <span v-if="todaySessions > 0" class="nav-badge">{{ todaySessions }}</span>
        </button>

        <button :class="['nav-item', { active: view === 'history' }]" @click="switchView('history')">
          <span class="nav-icon">📅</span>
          <span>History</span>
          <span v-if="sessions.length" class="nav-badge">{{ sessions.length }}</span>
        </button>

        <div class="sidebar-label">Health</div>

        <button :class="['nav-item', { active: view === 'bodyweight' }]" @click="switchView('bodyweight')">
          <span class="nav-icon">⚖️</span>
          <span>Body Weight</span>
          <span v-if="bodyWeights.length" class="nav-badge">{{ bodyWeights.length }}</span>
        </button>

        <button :class="['nav-item', { active: view === 'records' }]" @click="switchView('records')">
          <span class="nav-icon">🏆</span>
          <span>Personal Records</span>
        </button>

        <button :class="['nav-item', { active: view === 'templates' }]" @click="switchView('templates')">
          <span class="nav-icon">📄</span>
          <span>Templates</span>
          <span v-if="templates.length" class="nav-badge">{{ templates.length }}</span>
        </button>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="drive-status">
          <div class="drive-dot" :style="{ background: driveConnected ? '#10b981' : '#f59e0b' }" />
          <div class="drive-info">
            <div class="drive-label">{{ driveConnected ? 'Google Drive' : 'Offline' }}</div>
            <div class="drive-sub">{{ driveConnected ? 'Synced' : 'Local storage only' }}</div>
          </div>
        </div>

        <el-dropdown @command="handleCmd" trigger="click" style="width:100%;">
          <button class="nav-item" style="width:100%;">
            <span class="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sync" :disabled="!driveConnected">
                <el-icon><Refresh /></el-icon> Sync Drive
              </el-dropdown-item>
              <el-dropdown-item command="signout" :disabled="!driveConnected" divided>
                <el-icon><SwitchButton /></el-icon> Sign out
              </el-dropdown-item>
              <el-dropdown-item command="export" divided>
                <el-icon><Download /></el-icon> Export Excel
              </el-dropdown-item>
              <el-dropdown-item command="setup">
                <el-icon><Key /></el-icon> Change Client ID
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>

    <!-- ── Main area ── -->
    <div class="main-area">
      <!-- Top header -->
      <header class="main-header">
        <div class="page-breadcrumb">
          <span>Workspace</span>
          <span style="color:var(--border);">/</span>
          <span class="crumb-active">{{ pageTitle }}</span>
        </div>
        <div class="header-actions">
          <el-button v-if="view === 'log'" type="primary" :icon="Plus" @click="switchView('log')">
            New Session
          </el-button>
          <div style="font-size:13px; color:var(--text-3);">
            {{ currentDate }}
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="main-content">
        <Dashboard
          v-if="view === 'dashboard'"
          :plan="plan"
          :sessions="sessions"
          @go-log="switchView('log')"
          @go-history="switchView('history')"
          @edit-session="onEditSession"
          @start-day="onStartDay"
        />
        <PlanView
          v-else-if="view === 'plan'"
          :plan="plan"
          @update-plan="onPlanUpdated"
        />
        <LogWorkout
          v-else-if="view === 'log'"
          :plan="plan"
          :sessions="sessions"
          :edit-session="editingSession"
          :preloaded-template="preloadedTemplate"
          @save="onSessionSaved"
          @cancel="editingSession = null; preloadedTemplate = null"
          @template-consumed="preloadedTemplate = null"
          @save-template="onSaveTemplate"
        />
        <WorkoutHistory
          v-else-if="view === 'history'"
          :sessions="sessions"
          :plan="plan"
          :body-weights="bodyWeights"
          @edit="onEditSession"
          @delete="onDeleteSession"
        />
        <BodyWeight
          v-else-if="view === 'bodyweight'"
          :model-value="bodyWeights"
          @update:model-value="onBodyWeightsUpdated"
        />
        <PersonalRecords
          v-else-if="view === 'records'"
          :sessions="sessions"
          :plan="plan"
        />
        <Templates
          v-else-if="view === 'templates'"
          :model-value="templates"
          :plan="plan"
          @update:model-value="onTemplatesUpdated"
          @load-template="onLoadTemplate"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, Refresh, SwitchButton, Key, Plus, Download } from '@element-plus/icons-vue';
import { exportToExcel } from './composables/useExport.js';

import SetupScreen    from './components/SetupScreen.vue';
import AuthScreen     from './components/AuthScreen.vue';
import Dashboard      from './components/Dashboard.vue';
import PlanView       from './components/PlanView.vue';
import LogWorkout     from './components/LogWorkout.vue';
import WorkoutHistory from './components/WorkoutHistory.vue';
import BodyWeight        from './components/BodyWeight.vue';
import PersonalRecords  from './components/PersonalRecords.vue';
import Templates        from './components/Templates.vue';

import { DEFAULT_PLAN, deepClone, today } from './data/workoutPlan.js';
import * as Drive from './services/googleDrive.js';
import { parseLogXlsx, buildLogXlsx, parsePlanXlsx, buildPlanXlsx } from './services/workoutData.js';

// ── App state ──────────────────────────────────────────────────────────────
const appState    = ref('setup');
const authLoading = ref(false);
const authError   = ref('');
const loadingMsg  = ref('Connecting…');
const driveConnected = ref(false);

const plan          = ref(loadLocalPlan());
const sessions      = ref(loadLocalSessions());
const bodyWeights   = ref(loadLocalWeights());
const templates     = ref(loadLocalTemplates());
const view          = ref('dashboard');
const editingSession      = ref(null);
const preloadedTemplate   = ref(null);

let logFileId  = null;
let planFileId = null;

// ── Computed ───────────────────────────────────────────────────────────────
const pageTitle = computed(() => ({
  dashboard: 'Dashboard', plan: 'Weekly Plan', log: 'Log Workout',
  history: 'History', bodyweight: 'Body Weight', records: 'Personal Records',
  templates: 'Templates',
}[view.value] || 'Dashboard'));

const currentDate = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

const todaySessions = computed(() =>
  sessions.value.filter((s) => s.date === today()).length
);

// ── Boot ───────────────────────────────────────────────────────────────────
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
function goOffline() { driveConnected.value = false; appState.value = 'app'; }

async function handleSignIn() {
  authLoading.value = true;
  authError.value = '';
  try {
    await Drive.requestToken();
    driveConnected.value = true;
    await loadDriveFiles();
    appState.value = 'app';
  } catch (e) {
    authError.value = e.message || 'Sign-in failed';
  } finally {
    authLoading.value = false;
  }
}

// ── Drive ──────────────────────────────────────────────────────────────────
async function loadDriveFiles() {
  appState.value = 'loading';
  loadingMsg.value = 'Loading plan from Drive…';
  try {
    let planFile = await Drive.findFileByName('workout_plan.xlsx');
    if (planFile) {
      planFileId = planFile.id;
      const parsed = parsePlanXlsx(await Drive.downloadFile(planFile.id));
      if (parsed) { plan.value = parsed; saveLocalPlan(parsed); }
    } else {
      const created = await Drive.createFile('workout_plan.xlsx', new Uint8Array(buildPlanXlsx(plan.value)));
      planFileId = created.id;
    }
    loadingMsg.value = 'Loading workout history…';
    let logFile = await Drive.findFileByName('workout_log.xlsx');
    if (logFile) {
      logFileId = logFile.id;
      const parsed = parseLogXlsx(await Drive.downloadFile(logFile.id));
      sessions.value = parsed; saveLocalSessions(parsed);
    } else {
      const created = await Drive.createFile('workout_log.xlsx', new Uint8Array(buildLogXlsx([])));
      logFileId = created.id;
    }
  } catch (e) {
    ElMessage.error('Drive load failed: ' + e.message);
  }
}

async function persistLog(updated) {
  saveLocalSessions(updated);
  if (!driveConnected.value || !logFileId) return;
  try { await Drive.updateFile(logFileId, new Uint8Array(buildLogXlsx(updated))); }
  catch (e) { ElMessage.error('Save failed: ' + e.message); }
}

async function persistPlan(updated) {
  saveLocalPlan(updated);
  if (!driveConnected.value || !planFileId) return;
  try { await Drive.updateFile(planFileId, new Uint8Array(buildPlanXlsx(updated))); }
  catch (e) { ElMessage.error('Save failed: ' + e.message); }
}

// ── Handlers ───────────────────────────────────────────────────────────────
function switchView(v) {
  if (v !== 'log') editingSession.value = null;
  view.value = v;
}

function onPlanUpdated(newPlan) {
  plan.value = newPlan;
  persistPlan(newPlan);
  ElMessage.success('Plan updated!');
}

function onSessionSaved(session) {
  const idx = sessions.value.findIndex((s) => s.id === session.id);
  const updated = [...sessions.value];
  if (idx >= 0) updated[idx] = session; else updated.push(session);
  sessions.value = updated;
  editingSession.value = null;
  persistLog(updated);
}

function onEditSession(session) {
  editingSession.value = deepClone(session);
  view.value = 'log';
}

function onStartDay(dayNum) {
  // pre-select that day in log view
  editingSession.value = null;
  view.value = 'log';
}

function onBodyWeightsUpdated(updated) {
  bodyWeights.value = updated;
  localStorage.setItem('wl_weights', JSON.stringify(updated));
}

function onTemplatesUpdated(updated) {
  templates.value = updated;
  localStorage.setItem('wl_templates', JSON.stringify(updated));
}

function onLoadTemplate(tpl) {
  preloadedTemplate.value = tpl;
  view.value = 'log';
}

function onSaveTemplate(tplData) {
  const newTpl = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2,5),
    name: tplData.name,
    exercises: tplData.exercises,
    muscles: [...new Set(tplData.exercises.map(e => e.muscle).filter(Boolean))],
    createdAt: new Date().toISOString().slice(0, 10),
    usedCount: 0,
  };
  const updated = [...templates.value, newTpl];
  templates.value = updated;
  localStorage.setItem('wl_templates', JSON.stringify(updated));
}

function onDeleteSession(id) {
  const updated = sessions.value.filter((s) => s.id !== id);
  sessions.value = updated;
  persistLog(updated);
  ElMessage.success('Session deleted');
}

async function handleCmd(cmd) {
  if (cmd === 'sync') {
    ElMessage.info('Syncing…');
    await loadDriveFiles();
    appState.value = 'app';
    ElMessage.success('Synced!');
  } else if (cmd === 'signout') {
    Drive.signOut(); driveConnected.value = false;
    ElMessage.info('Signed out');
  } else if (cmd === 'export') {
    exportToExcel({ sessions: sessions.value, bodyWeights: bodyWeights.value, dateFrom: null, dateTo: null });
  } else if (cmd === 'setup') {
    appState.value = 'setup';
  }
}

// ── Local storage ──────────────────────────────────────────────────────────
function loadLocalPlan()     { try { return JSON.parse(localStorage.getItem('wl_plan'))     || deepClone(DEFAULT_PLAN); } catch { return deepClone(DEFAULT_PLAN); } }
function loadLocalSessions() { try { return JSON.parse(localStorage.getItem('wl_sessions')) || []; }                    catch { return []; } }
function loadLocalWeights()   { try { return JSON.parse(localStorage.getItem('wl_weights'))   || []; } catch { return []; } }
function loadLocalTemplates() { try { return JSON.parse(localStorage.getItem('wl_templates')) || []; } catch { return []; } }
function saveLocalPlan(p)    { localStorage.setItem('wl_plan',     JSON.stringify(p)); }
function saveLocalSessions(s){ localStorage.setItem('wl_sessions', JSON.stringify(s)); }
</script>
