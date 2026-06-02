<template>
  <div class="fade-up">

    <!-- Edit mode back button -->
    <div v-if="editMode" style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
      <el-button :icon="ArrowLeft" circle plain size="small" @click="$emit('cancel')" />
      <span class="page-title" style="font-size:18px;">Edit Session</span>
    </div>

    <!-- ── Step 1: Date + Day picker (new session only) ── -->
    <template v-if="!editMode">
      <div class="page-title" style="margin-bottom:4px;">Log Workout</div>
      <div class="page-subtitle" style="margin-bottom:18px;">Select a date and day to begin</div>

      <!-- Date + Existing sessions row -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;">
        <div>
          <div class="section-title">Date</div>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            format="DD MMM YYYY"
            value-format="YYYY-MM-DD"
            :clearable="false"
            size="large"
            style="width:100%;"
            @change="onDateChange"
          />
        </div>
        <div>
          <div class="section-title">Load saved</div>
          <el-select
            v-if="sessionsOnDate.length"
            v-model="loadSessionId"
            placeholder="Pick session…"
            size="large"
            style="width:100%;"
            clearable
            @change="loadSession"
          >
            <el-option v-for="s in sessionsOnDate" :key="s.id" :label="s.dayLabel" :value="s.id" />
          </el-select>
          <div v-else style="height:40px; display:flex; align-items:center; font-size:12px; color:var(--text-3);">
            No sessions on this date
          </div>
        </div>
      </div>

      <!-- Day grid -->
      <div class="section-title">Select Day</div>
      <div class="day-grid">
        <div
          v-for="n in 6" :key="n"
          :class="['day-btn', { active: selectedDay === n }]"
          :style="{ '--day-color': plan[n].color }"
          @click="selectDay(n)"
        >
          <div class="day-num">Day {{ n }}</div>
          <div class="day-label">{{ plan[n].label }}</div>
        </div>
        <div
          :class="['day-btn', { active: selectedDay === 'custom' }]"
          style="--day-color: #fd79a8;"
          @click="selectDay('custom')"
        >
          <div class="day-num" style="color:#fd79a8;">Custom</div>
          <div class="day-label">New workout</div>
        </div>
      </div>

      <el-input
        v-if="selectedDay === 'custom'"
        v-model="customLabel"
        placeholder="Workout name e.g. Full Body"
        size="large"
        style="margin-bottom:14px;"
        @keyup.enter="startSession"
      />

      <el-button
        type="primary"
        size="large"
        :disabled="!selectedDay"
        style="width:100%; height:50px; font-size:15px; font-weight:700; border-radius:14px; margin-bottom:20px;"
        @click="startSession"
      >
        Start Logging →
      </el-button>
    </template>

    <!-- ── Active session ── -->
    <template v-if="session">

      <!-- Session hero card -->
      <div
        class="session-hero"
        :style="{ background: `linear-gradient(135deg, ${heroColor}, ${darken(heroColor)})` }"
      >
        <div class="day-tag">{{ session.dayNumber ? `Day ${session.dayNumber}` : 'Custom' }}</div>
        <div class="session-title">{{ session.dayLabel }}</div>
        <div class="session-date">{{ formatDate(session.date) }}</div>
        <div class="session-stats">
          <div class="session-stat">💪 {{ session.exercises.length }} exercises</div>
          <div class="session-stat">📊 {{ totalSetsCompleted }}/{{ totalSets }} sets done</div>
          <div class="session-stat" v-if="anyCardio">🏃 Cardio ✓</div>
        </div>
      </div>

      <!-- Exercises -->
      <div class="section-title">Exercises</div>

      <div v-for="(ex, exIdx) in session.exercises" :key="ex.id" class="exercise-card">
        <!-- Card header -->
        <div class="exercise-card-header" @click="toggleExpand(ex.id)">
          <div class="exercise-name-row">
            <span :class="['chevron', { open: expanded.has(ex.id) }]">▶</span>
            <span class="exercise-name">{{ ex.name }}</span>
            <el-tag
              :type="ex.type === 'Compound' ? 'warning' : 'info'"
              size="small"
              effect="plain"
              style="flex-shrink:0;"
            >{{ ex.type || 'Custom' }}</el-tag>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span :class="['progress-badge', { 'all-done': completedSets(ex) === ex.sets.length && ex.sets.length > 0 }]">
              {{ completedSets(ex) }}/{{ ex.sets.length }}
            </span>
            <el-button type="danger" :icon="Delete" circle plain size="small" @click.stop="removeExercise(exIdx)" />
          </div>
        </div>

        <!-- Card body -->
        <div v-show="expanded.has(ex.id)" class="exercise-body">
          <div v-if="ex.tip" class="exercise-tip">
            <span>💡</span><span>{{ ex.tip }}</span>
          </div>
          <div v-if="ex.repsTarget" class="target-label">
            🎯 Target: {{ ex.sets.length }} × {{ ex.repsTarget }} reps
          </div>

          <!-- Set table -->
          <table class="set-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Reps</th>
                <th>Weight (kg)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(set, si) in ex.sets" :key="set.id" class="set-row-tr">
                <td>
                  <div :class="['set-num', { done: isSetDone(set) }]">{{ si + 1 }}</div>
                </td>
                <td>
                  <el-input
                    v-model="set.reps"
                    placeholder="–"
                    class="set-input"
                    size="small"
                  />
                </td>
                <td>
                  <el-input
                    v-model="set.weight"
                    placeholder="–"
                    class="set-input"
                    size="small"
                  />
                </td>
                <td>
                  <el-button :icon="Close" circle plain size="small" type="info" @click="removeSet(ex, si)" />
                </td>
              </tr>
            </tbody>
          </table>

          <div class="set-actions">
            <el-button size="small" :icon="Plus" plain @click="addSet(ex)" style="border-radius:8px;">
              Add Set
            </el-button>
            <span style="font-size:11px; font-weight:600; color:var(--success);" v-if="completedSets(ex) === ex.sets.length && ex.sets.length > 0">
              ✓ All sets done
            </span>
            <span style="font-size:11px; color:var(--text-3);" v-else>
              {{ completedSets(ex) }} of {{ ex.sets.length }} done
            </span>
          </div>
        </div>
      </div>

      <!-- Add exercise button -->
      <button class="add-ex-btn" @click="showAddExDialog = true">
        <el-icon><Plus /></el-icon>
        Add Exercise
      </button>

      <!-- ── Cardio ── -->
      <div class="section-title">Cardio</div>
      <div class="cardio-card">
        <div class="cardio-card-header">
          <span style="font-size:16px;">🏃</span>
          <span>Cardio Warmup</span>
          <span style="font-size:11px; color:rgba(255,255,255,0.4); margin-left:auto;">toggle to log</span>
        </div>
        <div v-for="item in cardioItems" :key="item.key" class="cardio-row">
          <div class="cardio-label">
            <div class="cardio-icon" :style="{ background: item.bg }">{{ item.icon }}</div>
            <div>
              <div class="cardio-name">{{ item.label }}</div>
              <div class="cardio-hint">{{ item.hint }}</div>
            </div>
          </div>
          <div class="cardio-controls">
            <div v-if="session.cardio[item.key].done" class="duration-badge">
              <el-input-number
                v-model="session.cardio[item.key].duration"
                :min="1" :max="120" :step="5"
                controls-position="right"
                size="small"
                style="width:80px;"
              />
              <span style="font-size:11px; color:var(--text-3);">min</span>
            </div>
            <el-switch v-model="session.cardio[item.key].done" />
          </div>
        </div>
      </div>

      <!-- ── Notes ── -->
      <div class="notes-card">
        <div class="notes-card-header">📝 Session Notes</div>
        <el-input
          v-model="session.notes"
          type="textarea"
          :rows="3"
          placeholder="How did it feel? Any PRs? Pain points?"
          :border="false"
          style="border-radius:0 0 var(--radius-lg) var(--radius-lg);"
        />
      </div>

      <!-- Save / Cancel -->
      <div style="display:flex; gap:10px;">
        <el-button v-if="editMode" @click="$emit('cancel')" style="flex:1; height:50px; border-radius:14px;">
          Cancel
        </el-button>
        <el-button
          type="primary"
          size="large"
          :loading="saving"
          @click="saveSession"
          style="flex:2; height:50px; font-size:15px; font-weight:700; border-radius:14px;"
        >
          {{ editMode ? '✓ Update Session' : '✓ Save Workout' }}
        </el-button>
      </div>
    </template>

    <!-- ── Add Exercise Dialog ── -->
    <el-dialog
      v-model="showAddExDialog"
      title="Add Exercise"
      width="94%"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-tabs v-model="addExTab">
        <el-tab-pane label="From Plan" name="plan">
          <el-input
            v-model="exSearch"
            placeholder="Search exercises…"
            :prefix-icon="Search"
            clearable
            style="margin-bottom:12px;"
          />
          <div style="max-height:300px; overflow-y:auto;">
            <div
              v-for="ex in filteredPlanExercises"
              :key="ex.name"
              style="display:flex; align-items:center; justify-content:space-between; padding:10px 6px; border-bottom:1px solid var(--border); cursor:pointer; border-radius:8px; transition:background 0.12s;"
              @click="addFromPlan(ex)"
              @mouseenter="$event.currentTarget.style.background='var(--surface)'"
              @mouseleave="$event.currentTarget.style.background=''"
            >
              <div>
                <div style="font-size:14px; font-weight:600; color:var(--text-1);">{{ ex.name }}</div>
                <div style="font-size:12px; color:var(--text-3); margin-top:2px;">{{ ex.dayLabel }} · {{ ex.sets }} × {{ ex.repsTarget }}</div>
              </div>
              <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">{{ ex.type }}</el-tag>
            </div>
            <div v-if="!filteredPlanExercises.length" style="padding:32px; text-align:center; color:var(--text-3); font-size:14px;">
              No matches found
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Custom" name="manual">
          <el-form label-position="top">
            <el-form-item label="Exercise name" required>
              <el-input v-model="manualEx.name" placeholder="e.g. Incline Dumbbell Curl" />
            </el-form-item>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="Type">
                  <el-select v-model="manualEx.type" style="width:100%;">
                    <el-option label="Compound" value="Compound" />
                    <el-option label="Isolation" value="Isolation" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Sets">
                  <el-input-number v-model="manualEx.sets" :min="1" :max="10" controls-position="right" style="width:100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Reps">
                  <el-input v-model="manualEx.repsTarget" placeholder="10" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Tip (optional)">
              <el-input v-model="manualEx.tip" placeholder="Coaching note…" />
            </el-form-item>
          </el-form>
          <el-button
            type="primary"
            style="width:100%; height:44px; border-radius:12px; font-weight:700;"
            :disabled="!manualEx.name.trim()"
            @click="addManualExercise"
          >
            Add Exercise
          </el-button>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Delete, Plus, Close, Search } from '@element-plus/icons-vue';
import {
  sessionFromPlan, newCustomSession, makeSets, uid, today, deepClone,
} from '../data/workoutPlan.js';

const props = defineProps({ plan: Object, sessions: Array, editSession: Object });
const emit = defineEmits(['save', 'cancel']);

// ── State ──────────────────────────────────────────────────────────────────
const selectedDate  = ref(today());
const selectedDay   = ref(null);
const customLabel   = ref('');
const loadSessionId = ref(null);
const session       = ref(props.editSession ? deepClone(props.editSession) : null);
const editMode      = computed(() => !!props.editSession);
const saving        = ref(false);
const expanded      = ref(new Set());
const showAddExDialog = ref(false);
const addExTab      = ref('plan');
const exSearch      = ref('');
const manualEx      = ref({ name: '', type: 'Isolation', sets: 3, repsTarget: '10', tip: '' });

const cardioItems = [
  { key: 'treadmill', label: 'Treadmill',  hint: '15 min moderate pace',  icon: '🏃', bg: '#fff3e0' },
  { key: 'jogging',   label: 'Jogging',    hint: 'Outdoor or track',       icon: '🏅', bg: '#e8f5e9' },
  { key: 'cycling',   label: 'Cycling',    hint: '15 min steady state',    icon: '🚴', bg: '#e3f2fd' },
];

// ── Computed ───────────────────────────────────────────────────────────────
const heroColor = computed(() => {
  if (session.value?.dayNumber) return props.plan[session.value.dayNumber]?.color || '#6c5ce7';
  return '#fd79a8';
});

const sessionsOnDate = computed(() =>
  props.sessions.filter((s) => s.date === selectedDate.value)
);

const allPlanExercises = computed(() => {
  const list = [];
  Object.entries(props.plan).forEach(([dayNum, day]) => {
    day.exercises.forEach((ex) => list.push({ ...ex, dayLabel: `Day ${dayNum}` }));
  });
  return list;
});

const filteredPlanExercises = computed(() => {
  const q = exSearch.value.toLowerCase();
  return q ? allPlanExercises.value.filter((e) => e.name.toLowerCase().includes(q)) : allPlanExercises.value;
});

const totalSets = computed(() => session.value?.exercises.reduce((a, ex) => a + ex.sets.length, 0) ?? 0);
const totalSetsCompleted = computed(() => session.value?.exercises.reduce((a, ex) => a + completedSets(ex), 0) ?? 0);
const anyCardio = computed(() => Object.values(session.value?.cardio ?? {}).some((c) => c.done));

// ── Helpers ────────────────────────────────────────────────────────────────
function darken(hex) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 50);
    const g = Math.max(0, ((n >> 8) & 0xff) - 50);
    const b = Math.max(0, (n & 0xff) - 50);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch { return hex; }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
}

function completedSets(ex) {
  return ex.sets.filter((s) => isSetDone(s)).length;
}

function isSetDone(set) {
  return String(set.reps).trim() !== '' && String(set.reps).trim() !== '0';
}

// ── Methods ────────────────────────────────────────────────────────────────
function onDateChange() { loadSessionId.value = null; }

function loadSession(id) {
  const found = props.sessions.find((s) => s.id === id);
  if (found) {
    session.value = deepClone(found);
    expanded.value = new Set(session.value.exercises.map((e) => e.id));
  }
}

function selectDay(n) {
  selectedDay.value = n;
  session.value = null;
}

function startSession() {
  if (!selectedDay.value) return;
  session.value = selectedDay.value === 'custom'
    ? newCustomSession(selectedDate.value, customLabel.value)
    : sessionFromPlan(selectedDay.value, props.plan, selectedDate.value);
  expanded.value = new Set(session.value.exercises.map((e) => e.id));
}

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}

function addSet(ex)            { ex.sets.push({ id: uid(), reps: '', weight: '' }); }
function removeSet(ex, idx)    { if (ex.sets.length > 1) ex.sets.splice(idx, 1); }
function removeExercise(idx)   { session.value.exercises.splice(idx, 1); }

function addFromPlan(planEx) {
  const ex = { id: uid(), name: planEx.name, type: planEx.type, tip: planEx.tip, repsTarget: planEx.repsTarget, isCustom: false, sets: makeSets(planEx.sets) };
  session.value.exercises.push(ex);
  expanded.value = new Set([...expanded.value, ex.id]);
  showAddExDialog.value = false;
  exSearch.value = '';
}

function addManualExercise() {
  if (!manualEx.value.name.trim()) return;
  const ex = { id: uid(), name: manualEx.value.name.trim(), type: manualEx.value.type, tip: manualEx.value.tip, repsTarget: manualEx.value.repsTarget, isCustom: true, sets: makeSets(manualEx.value.sets) };
  session.value.exercises.push(ex);
  expanded.value = new Set([...expanded.value, ex.id]);
  showAddExDialog.value = false;
  manualEx.value = { name: '', type: 'Isolation', sets: 3, repsTarget: '10', tip: '' };
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
      customLabel.value = '';
      loadSessionId.value = null;
    }
  } finally {
    saving.value = false;
  }
}

watch(() => props.editSession, (v) => {
  if (v) {
    session.value = deepClone(v);
    expanded.value = new Set(session.value.exercises.map((e) => e.id));
  }
}, { immediate: true });
</script>
