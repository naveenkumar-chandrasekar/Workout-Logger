<template>
  <div class="fade-up" style="height:100%;">
    <div class="log-workspace">

      <!-- ═══════════════════════════════════
           LEFT PANEL — always visible
      ═══════════════════════════════════ -->
      <div class="log-left">
        <div class="panel-title">
          <span>Session Setup</span>
        </div>

        <!-- Date -->
        <div class="field-group">
          <label class="field-label">Date</label>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            format="DD MMM YYYY"
            value-format="YYYY-MM-DD"
            :clearable="false"
            style="width:100%;"
            @change="onDateChange"
          />
        </div>

        <!-- Load existing -->
        <div class="field-group" v-if="sessionsOnDate.length">
          <label class="field-label">Load saved session</label>
          <el-select v-model="loadSessionId" placeholder="Select…" style="width:100%;" clearable @change="loadSession">
            <el-option v-for="s in sessionsOnDate" :key="s.id" :label="s.dayLabel" :value="s.id" />
          </el-select>
        </div>

        <!-- Day selector -->
        <div class="field-group">
          <label class="field-label">Select day</label>
          <div class="day-list">
            <div
              v-for="n in 6"
              :key="n"
              :class="['day-list-item', { active: selectedDay === n }]"
              :style="{ '--dc': plan[n].color }"
              @click="selectDay(n)"
            >
              <span class="day-list-dot" :style="{ background: plan[n].color }" />
              <div style="flex:1; min-width:0;">
                <div class="day-list-num">Day {{ n }}</div>
                <div class="day-list-label">{{ plan[n].label }}</div>
              </div>
              <el-icon v-if="selectedDay === n" style="color:var(--dc); flex-shrink:0;"><Check /></el-icon>
            </div>
            <div
              :class="['day-list-item', { active: selectedDay === 'custom' }]"
              style="--dc:#fd79a8;"
              @click="selectDay('custom')"
            >
              <span class="day-list-dot" style="background:#fd79a8;" />
              <div style="flex:1;">
                <div class="day-list-num">Custom</div>
                <div class="day-list-label">Free workout</div>
              </div>
              <el-icon v-if="selectedDay === 'custom'" style="color:#fd79a8; flex-shrink:0;"><Check /></el-icon>
            </div>
          </div>
        </div>

        <!-- Custom name -->
        <div class="field-group" v-if="selectedDay === 'custom'">
          <label class="field-label">Workout name</label>
          <el-input v-model="customLabel" placeholder="e.g. Full Body" @keyup.enter="startSession" />
        </div>

        <el-button
          type="primary"
          :disabled="!selectedDay || (session !== null && !editMode)"
          style="width:100%; height:40px; font-weight:700; border-radius:8px; margin-top:4px;"
          @click="startSession"
        >
          {{ session ? 'Restart Session' : 'Start Logging' }}
        </el-button>

        <!-- Session mini-summary if active -->
        <div v-if="session" class="session-summary">
          <div class="summary-row">
            <span class="summary-key">Status</span>
            <el-tag type="success" size="small" effect="light">Active</el-tag>
          </div>
          <div class="summary-row">
            <span class="summary-key">Exercises</span>
            <span class="summary-val">{{ session.exercises.length }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-key">Sets done</span>
            <span class="summary-val">{{ totalSetsCompleted }}/{{ totalSets }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-key">Cardio</span>
            <span class="summary-val">{{ anyCardio ? '✓ Logged' : 'Not logged' }}</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════
           RIGHT PANEL — exercises
      ═══════════════════════════════════ -->
      <div class="log-right">

        <!-- Empty state -->
        <div v-if="!session" class="log-empty">
          <div style="font-size:52px; margin-bottom:16px;">💪</div>
          <div style="font-size:20px; font-weight:700; color:var(--text-1); margin-bottom:8px;">Ready to train?</div>
          <div style="font-size:14px; color:var(--text-3);">Select a day on the left and click <strong>Start Logging</strong> to begin.</div>
        </div>

        <!-- Active session -->
        <template v-if="session">

          <!-- Session header bar -->
          <div class="session-header-bar" :style="{ background: `linear-gradient(135deg, ${heroColor}, ${darken(heroColor)})` }">
            <div>
              <div style="font-size:11px; font-weight:700; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
                {{ session.dayNumber ? `Day ${session.dayNumber}` : 'Custom' }}
              </div>
              <div style="font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.3px;">{{ session.dayLabel }}</div>
              <div style="font-size:13px; color:rgba(255,255,255,0.55); margin-top:3px;">{{ formatDate(session.date) }}</div>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <div class="session-stat-chip">💪 {{ session.exercises.length }} exercises</div>
              <div class="session-stat-chip">📊 {{ totalSetsCompleted }}/{{ totalSets }} sets</div>
            </div>
          </div>

          <!-- ── Exercises table ── -->
          <div class="exercises-section">
            <div class="exercises-section-header">
              <span style="font-size:14px; font-weight:700; color:var(--text-1);">Exercises</span>
              <el-button :icon="Plus" type="primary" plain size="small" style="border-radius:8px;" @click="showAddExDialog = true">
                Add Exercise
              </el-button>
            </div>

            <!-- Exercise rows -->
            <div v-for="(ex, exIdx) in session.exercises" :key="ex.id" class="exercise-row-wrap">
              <!-- Exercise name row -->
              <div class="ex-title-row" @click="toggleExpand(ex.id)">
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                  <span class="chevron" :class="{ open: expanded.has(ex.id) }">▶</span>
                  <span style="font-size:14px; font-weight:700; color:var(--text-1);">{{ ex.name }}</span>
                  <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">{{ ex.type || 'Custom' }}</el-tag>
                  <span v-if="ex.tip" style="font-size:12px; color:var(--text-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px;">{{ ex.tip }}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <span :class="['progress-badge', { 'all-done': completedSets(ex) === ex.sets.length && ex.sets.length > 0 }]">
                    {{ completedSets(ex) }}/{{ ex.sets.length }} sets
                  </span>
                  <el-button :icon="Delete" type="danger" plain size="small" circle @click.stop="removeExercise(exIdx)" />
                </div>
              </div>

              <!-- Sets table (expandable) -->
              <div v-show="expanded.has(ex.id)" class="sets-table-wrap">
                <div v-if="ex.repsTarget" style="font-size:11px; color:var(--text-3); padding:6px 0 4px; font-weight:600;">
                  🎯 Target: {{ ex.sets.length }} sets × {{ ex.repsTarget }} reps
                </div>
                <table class="sets-table">
                  <thead>
                    <tr>
                      <th style="width:40px;">Set</th>
                      <th>Reps</th>
                      <th>Weight (kg)</th>
                      <th style="width:80px; text-align:right;">Status</th>
                      <th style="width:36px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(set, si) in ex.sets" :key="set.id" class="set-tr">
                      <td>
                        <div :class="['set-num', { done: isSetDone(set) }]">{{ si + 1 }}</div>
                      </td>
                      <td>
                        <el-input v-model="set.reps" placeholder="–" class="set-input" size="small" style="max-width:100px;" />
                      </td>
                      <td>
                        <el-input v-model="set.weight" placeholder="–" class="set-input" size="small" style="max-width:100px;" />
                      </td>
                      <td style="text-align:right;">
                        <span v-if="isSetDone(set)" style="font-size:12px; font-weight:600; color:var(--success);">✓ Done</span>
                        <span v-else style="font-size:12px; color:var(--text-3);">Pending</span>
                      </td>
                      <td>
                        <el-button :icon="Close" plain size="small" circle type="info" @click="removeSet(ex, si)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style="padding:10px 0 4px;">
                  <el-button :icon="Plus" size="small" plain style="border-radius:8px;" @click="addSet(ex)">Add Set</el-button>
                </div>
              </div>
            </div>

            <div v-if="!session.exercises.length" style="padding:32px; text-align:center; color:var(--text-3);">
              No exercises yet. Click <strong>Add Exercise</strong> to get started.
            </div>
          </div>

          <!-- ── Cardio ── -->
          <div class="exercises-section" style="margin-top:20px;">
            <div class="exercises-section-header">
              <span style="font-size:14px; font-weight:700; color:var(--text-1);">Cardio</span>
              <span style="font-size:12px; color:var(--text-3);">Toggle to log</span>
            </div>
            <div class="cardio-grid">
              <div v-for="item in cardioItems" :key="item.key" class="cardio-grid-item">
                <div style="display:flex; align-items:center; gap:10px; flex:1;">
                  <div class="cardio-icon" :style="{ background: item.bg }">{{ item.icon }}</div>
                  <div>
                    <div style="font-size:13px; font-weight:600; color:var(--text-1);">{{ item.label }}</div>
                    <div style="font-size:11px; color:var(--text-3);">{{ item.hint }}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <template v-if="session.cardio[item.key].done">
                    <el-input-number
                      v-model="session.cardio[item.key].duration"
                      :min="1" :max="120" :step="5"
                      controls-position="right"
                      size="small"
                      style="width:100px;"
                    />
                    <span style="font-size:12px; color:var(--text-3);">min</span>
                  </template>
                  <el-switch v-model="session.cardio[item.key].done" />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Notes + Save ── -->
          <div class="exercises-section" style="margin-top:20px;">
            <div class="exercises-section-header">
              <span style="font-size:14px; font-weight:700; color:var(--text-1);">Notes</span>
            </div>
            <el-input
              v-model="session.notes"
              type="textarea"
              :rows="3"
              placeholder="How did it feel? Any PRs or pain points?"
              style="width:100%;"
            />
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
              <el-button v-if="editMode" @click="$emit('cancel')" style="min-width:100px;">Cancel</el-button>
              <el-button type="primary" :loading="saving" @click="saveSession" style="min-width:160px; font-weight:700;">
                {{ editMode ? '✓ Update Session' : '✓ Save Workout' }}
              </el-button>
            </div>
          </div>

        </template>
      </div>
    </div>

    <!-- ── Add Exercise Dialog ── -->
    <el-dialog v-model="showAddExDialog" title="Add Exercise" width="640px" :close-on-click-modal="true" destroy-on-close>
      <el-tabs v-model="addExTab">
        <el-tab-pane label="From Plan" name="plan">
          <el-input v-model="exSearch" placeholder="Search exercises…" :prefix-icon="Search" clearable style="margin-bottom:12px;" />
          <el-table :data="filteredPlanExercises" style="width:100%;" max-height="340" @row-click="addFromPlan" row-class-name="clickable-row">
            <el-table-column prop="name" label="Exercise" min-width="180" />
            <el-table-column prop="dayLabel" label="Day" width="80" />
            <el-table-column prop="sets" label="Sets" width="60" align="center" />
            <el-table-column prop="repsTarget" label="Reps" width="70" align="center" />
            <el-table-column prop="type" label="Type" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Custom Exercise" name="manual">
          <el-form :model="manualEx" label-position="top" style="margin-top:4px;">
            <el-row :gutter="16">
              <el-col :span="14">
                <el-form-item label="Exercise name" required>
                  <el-input v-model="manualEx.name" placeholder="e.g. Incline Dumbbell Curl" />
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="Type">
                  <el-select v-model="manualEx.type" style="width:100%;">
                    <el-option label="Compound" value="Compound" />
                    <el-option label="Isolation" value="Isolation" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="Sets">
                  <el-input-number v-model="manualEx.sets" :min="1" :max="10" controls-position="right" style="width:100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Reps target">
                  <el-input v-model="manualEx.repsTarget" placeholder="10" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Muscle">
                  <el-input v-model="manualEx.muscle" placeholder="e.g. Chest" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Coaching tip">
              <el-input v-model="manualEx.tip" placeholder="Optional note…" />
            </el-form-item>
            <el-button type="primary" :disabled="!manualEx.name.trim()" style="width:100%; font-weight:700;" @click="addManualExercise">
              Add Exercise
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Delete, Plus, Close, Search, Check } from '@element-plus/icons-vue';
import { sessionFromPlan, newCustomSession, makeSets, uid, today, deepClone } from '../data/workoutPlan.js';

const props = defineProps({ plan: Object, sessions: Array, editSession: Object });
const emit  = defineEmits(['save', 'cancel']);

const selectedDate    = ref(today());
const selectedDay     = ref(null);
const customLabel     = ref('');
const loadSessionId   = ref(null);
const session         = ref(props.editSession ? deepClone(props.editSession) : null);
const editMode        = computed(() => !!props.editSession);
const saving          = ref(false);
const expanded        = ref(new Set());
const showAddExDialog = ref(false);
const addExTab        = ref('plan');
const exSearch        = ref('');
const manualEx        = ref({ name: '', type: 'Isolation', sets: 3, repsTarget: '10', muscle: '', tip: '' });

const cardioItems = [
  { key: 'treadmill', label: 'Treadmill',  hint: '15 min moderate pace',  icon: '🏃', bg: '#fff3e0' },
  { key: 'jogging',   label: 'Jogging',    hint: 'Outdoor or track run',   icon: '🏅', bg: '#e8f5e9' },
  { key: 'cycling',   label: 'Cycling',    hint: '15 min steady state',    icon: '🚴', bg: '#e3f2fd' },
];

const heroColor = computed(() => {
  if (session.value?.dayNumber) return props.plan[session.value.dayNumber]?.color || '#6c5ce7';
  return '#fd79a8';
});

const sessionsOnDate = computed(() => props.sessions.filter(s => s.date === selectedDate.value));

const allPlanExercises = computed(() => {
  const list = [];
  Object.entries(props.plan).forEach(([dayNum, day]) => {
    day.exercises.forEach(ex => list.push({ ...ex, dayLabel: `Day ${dayNum}` }));
  });
  return list;
});

const filteredPlanExercises = computed(() => {
  const q = exSearch.value.toLowerCase();
  return q ? allPlanExercises.value.filter(e => e.name.toLowerCase().includes(q)) : allPlanExercises.value;
});

const totalSets          = computed(() => session.value?.exercises.reduce((a, ex) => a + ex.sets.length, 0) ?? 0);
const totalSetsCompleted = computed(() => session.value?.exercises.reduce((a, ex) => a + completedSets(ex), 0) ?? 0);
const anyCardio          = computed(() => Object.values(session.value?.cardio ?? {}).some(c => c.done));

function darken(hex) {
  try {
    const n = parseInt(hex.slice(1), 16);
    return `#${[n>>16, (n>>8)&0xff, n&0xff].map(c => Math.max(0,c-50).toString(16).padStart(2,'0')).join('')}`;
  } catch { return hex; }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m)-1]} ${y}`;
}

function completedSets(ex)  { return ex.sets.filter(s => isSetDone(s)).length; }
function isSetDone(set)     { return String(set.reps).trim() !== '' && String(set.reps).trim() !== '0'; }

function onDateChange()     { loadSessionId.value = null; }
function loadSession(id)    { const f = props.sessions.find(s => s.id === id); if (f) { session.value = deepClone(f); expandAll(); } }
function selectDay(n)       { selectedDay.value = n; }

function startSession() {
  session.value = selectedDay.value === 'custom'
    ? newCustomSession(selectedDate.value, customLabel.value)
    : sessionFromPlan(selectedDay.value, props.plan, selectedDate.value);
  expandAll();
}

function expandAll() {
  expanded.value = new Set(session.value.exercises.map(e => e.id));
}

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}

function addSet(ex)          { ex.sets.push({ id: uid(), reps: '', weight: '' }); }
function removeSet(ex, idx)  { if (ex.sets.length > 1) ex.sets.splice(idx, 1); }
function removeExercise(idx) { session.value.exercises.splice(idx, 1); }

function addFromPlan(row) {
  const ex = { id: uid(), name: row.name, type: row.type, tip: row.tip, repsTarget: row.repsTarget, muscle: row.muscle || '', isCustom: false, sets: makeSets(row.sets) };
  session.value.exercises.push(ex);
  expanded.value = new Set([...expanded.value, ex.id]);
  showAddExDialog.value = false;
  exSearch.value = '';
}

function addManualExercise() {
  if (!manualEx.value.name.trim()) return;
  const ex = { id: uid(), name: manualEx.value.name.trim(), type: manualEx.value.type, tip: manualEx.value.tip, repsTarget: manualEx.value.repsTarget, muscle: manualEx.value.muscle, isCustom: true, sets: makeSets(manualEx.value.sets) };
  session.value.exercises.push(ex);
  expanded.value = new Set([...expanded.value, ex.id]);
  showAddExDialog.value = false;
  manualEx.value = { name: '', type: 'Isolation', sets: 3, repsTarget: '10', muscle: '', tip: '' };
}

async function saveSession() {
  if (!session.value) return;
  saving.value = true;
  try {
    emit('save', deepClone(session.value));
    ElMessage({ message: 'Workout saved!', type: 'success', duration: 2000 });
    if (!editMode.value) {
      session.value = null;
      selectedDay.value = null;
    }
  } finally { saving.value = false; }
}

watch(() => props.editSession, v => {
  if (v) { session.value = deepClone(v); expandAll(); }
}, { immediate: true });
</script>

<style scoped>
/* ── Two-panel workspace ── */
.log-workspace {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  height: calc(100vh - var(--header-h) - 64px);
  min-height: 0;
}

/* ── Left panel ── */
.log-left {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.7px; }

/* Day list */
.day-list { display: flex; flex-direction: column; gap: 4px; }

.day-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.14s;
}

.day-list-item:hover { background: var(--surface); border-color: var(--border); }

.day-list-item.active {
  background: color-mix(in srgb, var(--dc) 8%, white);
  border-color: var(--dc);
}

.day-list-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.day-list-num { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
.day-list-label { font-size: 12px; font-weight: 600; color: var(--text-2); margin-top: 1px; line-height: 1.3; }

.day-list-item.active .day-list-num   { color: var(--dc); }
.day-list-item.active .day-list-label { color: var(--text-1); }

/* Session mini summary */
.session-summary {
  background: var(--surface);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row { display: flex; align-items: center; justify-content: space-between; }
.summary-key { font-size: 12px; color: var(--text-3); font-weight: 500; }
.summary-val { font-size: 12px; font-weight: 700; color: var(--text-1); }

/* ── Right panel ── */
.log-right {
  padding-left: 24px;
  overflow-y: auto;
  height: 100%;
}

.log-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  text-align: center;
  padding: 40px;
}

/* Session header bar */
.session-header-bar {
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  gap: 16px;
}

.session-stat-chip {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 6px 12px;
}

/* Exercises section */
.exercises-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.exercises-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.exercise-row-wrap { border-bottom: 1px solid var(--border); }
.exercise-row-wrap:last-child { border-bottom: none; }

.ex-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  cursor: pointer;
  transition: background 0.12s;
  gap: 12px;
}

.ex-title-row:hover { background: #fafbff; }

.chevron { font-size: 10px; color: var(--text-3); transition: transform 0.2s; }
.chevron.open { transform: rotate(90deg); }

.progress-badge {
  font-size: 12px; font-weight: 700;
  color: var(--text-3); background: var(--surface);
  border-radius: 20px; padding: 3px 10px;
}

.progress-badge.all-done { color: var(--success); background: #d1fae5; }

/* Sets table */
.sets-table-wrap { padding: 4px 18px 14px; background: #fafbff; }

.sets-table { width: 100%; border-collapse: collapse; }

.sets-table th {
  text-align: left;
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}

.set-tr td { padding: 4px 8px; vertical-align: middle; }
.set-tr:hover td { background: rgba(108,92,231,0.03); }

.set-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--surface); border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--text-2);
  transition: all 0.15s;
}

.set-num.done { background: #d1fae5; border-color: #6ee7b7; color: #059669; }

/* Cardio grid */
.cardio-grid { padding: 4px 0; }

.cardio-grid-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  transition: background 0.12s;
}

.cardio-grid-item:last-child { border-bottom: none; }
.cardio-grid-item:hover { background: #fafbff; }

.cardio-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  flex-shrink: 0;
}

/* Set input */
.set-input :deep(.el-input__wrapper) { padding: 0 8px !important; min-height: 32px !important; }
.set-input :deep(.el-input__inner)   { font-size: 13px !important; font-weight: 700 !important; text-align: center !important; }

/* Clickable table row */
:deep(.clickable-row) { cursor: pointer; }
:deep(.clickable-row:hover td) { background: #f0f4ff !important; }
</style>
