<template>
  <!-- Setup: enter client ID -->
  <SetupScreen
    v-if="appState === 'setup'"
    @save="onClientIdSaved"
    @skip="goOffline"
  />

  <!-- Auth: sign in with Google -->
  <AuthScreen
    v-else-if="appState === 'auth'"
    :loading="authLoading"
    :error="authError"
    @signin="handleSignIn"
    @change-setup="appState = 'setup'"
  />

  <!-- Loading Drive files -->
  <div v-else-if="appState === 'loading'" style="min-height:100dvh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:16px;">
    <el-icon style="font-size:40px; color:#6c5ce7; animation: spin 1s linear infinite;"><Loading /></el-icon>
    <div style="color:#888; font-size:14px;">{{ loadingMsg }}</div>
  </div>

  <!-- Main app -->
  <div v-else-if="appState === 'app'" class="app-shell">
    <!-- Header -->
    <div class="app-header">
      <div class="logo">
        <span class="logo-emoji">🏋️</span>
        <div class="logo-text">
          <span class="brand">Workout Logger</span>
          <span class="tagline">6-day split · 74 kg</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div v-if="driveConnected" style="display:flex; align-items:center; gap:4px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); border-radius:20px; padding:4px 10px;">
          <span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span>
          <span style="font-size:11px; font-weight:600; color:#10b981;">Drive</span>
        </div>
        <div v-else style="display:flex; align-items:center; gap:4px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); border-radius:20px; padding:4px 10px;">
          <span style="width:6px; height:6px; border-radius:50%; background:#f59e0b; display:inline-block;"></span>
          <span style="font-size:11px; font-weight:600; color:#f59e0b;">Offline</span>
        </div>
        <el-dropdown @command="handleCmd" trigger="click">
          <el-button :icon="MoreFilled" circle size="small" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); color:#fff;" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sync" :disabled="!driveConnected">
                <el-icon><Refresh /></el-icon> Sync Drive
              </el-dropdown-item>
              <el-dropdown-item command="signout" :disabled="!driveConnected" divided>
                <el-icon><SwitchButton /></el-icon> Sign out
              </el-dropdown-item>
              <el-dropdown-item command="setup" divided>
                <el-icon><Setting /></el-icon> Change Client ID
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Page content -->
    <div class="page-content">
      <!-- Plan view -->
      <PlanView
        v-if="view === 'plan'"
        :plan="plan"
        @update-plan="onPlanUpdated"
      />

      <!-- Log view or Edit session -->
      <LogWorkout
        v-else-if="view === 'log'"
        :plan="plan"
        :sessions="sessions"
        :edit-session="editingSession"
        @save="onSessionSaved"
        @cancel="editingSession = null"
      />

      <!-- History -->
      <WorkoutHistory
        v-else-if="view === 'history'"
        :sessions="sessions"
        :plan="plan"
        @edit="onEditSession"
        @delete="onDeleteSession"
      />
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button :class="['nav-item', { active: view === 'plan' }]" @click="switchView('plan')">
        <span class="nav-icon">📋</span>
        <span>Plan</span>
      </button>
      <button :class="['nav-item', { active: view === 'log' }]" @click="switchView('log')">
        <span class="nav-icon">💪</span>
        <span>Log</span>
      </button>
      <button :class="['nav-item', { active: view === 'history' }]" @click="switchView('history')">
        <span class="nav-icon">📅</span>
        <span>History</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import { Loading, Connection, MoreFilled, Refresh, SwitchButton, Setting } from '@element-plus/icons-vue';

import SetupScreen from './components/SetupScreen.vue';
import AuthScreen from './components/AuthScreen.vue';
import PlanView from './components/PlanView.vue';
import LogWorkout from './components/LogWorkout.vue';
import WorkoutHistory from './components/WorkoutHistory.vue';

import { DEFAULT_PLAN, deepClone } from './data/workoutPlan.js';
import * as Drive from './services/googleDrive.js';
import { parseLogXlsx, buildLogXlsx, parsePlanXlsx, buildPlanXlsx } from './services/workoutData.js';

// ── App state machine ──────────────────────────────────────────────────────
const appState = ref('setup'); // setup | auth | loading | app
const authLoading = ref(false);
const authError = ref('');
const loadingMsg = ref('Connecting…');
const driveConnected = ref(false);

// ── Data ───────────────────────────────────────────────────────────────────
const plan = ref(loadLocalPlan());
const sessions = ref(loadLocalSessions());
const view = ref('log');
const editingSession = ref(null);

// File IDs on Drive
let logFileId = null;
let planFileId = null;

// ── Boot ───────────────────────────────────────────────────────────────────
const clientId = localStorage.getItem('wl_clientId');
if (clientId) {
  boot(clientId);
} else {
  appState.value = 'setup';
}

async function boot(cid) {
  appState.value = 'loading';
  loadingMsg.value = 'Initialising Google APIs…';
  try {
    await Drive.initGapiClient();
    Drive.initGis(cid);
    // Try silent sign-in (won't show popup)
    appState.value = 'auth';
  } catch (e) {
    console.warn('Drive init failed, going offline:', e.message);
    appState.value = 'app';
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────
function onClientIdSaved(cid) {
  boot(cid);
}

async function goOffline() {
  driveConnected.value = false;
  appState.value = 'app';
}

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

// ── Drive file operations ──────────────────────────────────────────────────
async function loadDriveFiles() {
  loadingMsg.value = 'Loading your plan from Drive…';
  appState.value = 'loading';

  try {
    // Plan
    let planFile = await Drive.findFileByName('workout_plan.xlsx');
    if (planFile) {
      planFileId = planFile.id;
      const buf = await Drive.downloadFile(planFile.id);
      const parsed = parsePlanXlsx(buf);
      if (parsed) {
        plan.value = parsed;
        saveLocalPlan(parsed);
      }
    } else {
      // Create it from default plan
      const data = buildPlanXlsx(plan.value);
      const created = await Drive.createFile('workout_plan.xlsx', new Uint8Array(data));
      planFileId = created.id;
    }

    // Log
    loadingMsg.value = 'Loading workout history…';
    let logFile = await Drive.findFileByName('workout_log.xlsx');
    if (logFile) {
      logFileId = logFile.id;
      const buf = await Drive.downloadFile(logFile.id);
      const parsed = parseLogXlsx(buf);
      sessions.value = parsed;
      saveLocalSessions(parsed);
    } else {
      const data = buildLogXlsx([]);
      const created = await Drive.createFile('workout_log.xlsx', new Uint8Array(data));
      logFileId = created.id;
    }
  } catch (e) {
    ElMessage.error('Drive load failed: ' + e.message);
    console.error(e);
  }
}

async function persistLog(updatedSessions) {
  saveLocalSessions(updatedSessions);
  if (!driveConnected.value || !logFileId) return;
  try {
    const data = buildLogXlsx(updatedSessions);
    await Drive.updateFile(logFileId, new Uint8Array(data));
  } catch (e) {
    ElMessage.error('Drive save failed: ' + e.message);
  }
}

async function persistPlan(updatedPlan) {
  saveLocalPlan(updatedPlan);
  if (!driveConnected.value || !planFileId) return;
  try {
    const data = buildPlanXlsx(updatedPlan);
    await Drive.updateFile(planFileId, new Uint8Array(data));
  } catch (e) {
    ElMessage.error('Drive save failed: ' + e.message);
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────
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
  if (idx >= 0) updated[idx] = session;
  else updated.push(session);
  sessions.value = updated;
  editingSession.value = null;
  persistLog(updated);
}

function onEditSession(session) {
  editingSession.value = deepClone(session);
  view.value = 'log';
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
    Drive.signOut();
    driveConnected.value = false;
    ElMessage.info('Signed out');
  } else if (cmd === 'setup') {
    appState.value = 'setup';
  }
}

// ── Local storage helpers ──────────────────────────────────────────────────
function loadLocalPlan() {
  try { return JSON.parse(localStorage.getItem('wl_plan')) || deepClone(DEFAULT_PLAN); }
  catch { return deepClone(DEFAULT_PLAN); }
}
function saveLocalPlan(p) {
  localStorage.setItem('wl_plan', JSON.stringify(p));
}
function loadLocalSessions() {
  try { return JSON.parse(localStorage.getItem('wl_sessions')) || []; }
  catch { return []; }
}
function saveLocalSessions(s) {
  localStorage.setItem('wl_sessions', JSON.stringify(s));
}
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
