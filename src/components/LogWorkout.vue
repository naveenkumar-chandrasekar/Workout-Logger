<template>
  <div>
    <!-- If editing existing session, show back + title -->
    <div v-if="editMode" style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
      <el-button :icon="ArrowLeft" circle plain size="small" @click="$emit('cancel')" />
      <span style="font-size:16px; font-weight:700;">Edit Session</span>
      <el-tag size="small" type="info">{{ session.date }}</el-tag>
    </div>

    <!-- Date + Day selector (only when not editing existing) -->
    <template v-if="!editMode">
      <el-row :gutter="10" style="margin-bottom:16px;" align="middle">
        <el-col :span="12">
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
        </el-col>
        <el-col :span="12">
          <div class="section-title">Existing sessions</div>
          <el-select
            v-if="sessionsOnDate.length"
            v-model="loadSessionId"
            placeholder="Load saved…"
            size="large"
            style="width:100%;"
            clearable
            @change="loadSession"
          >
            <el-option
              v-for="s in sessionsOnDate"
              :key="s.id"
              :label="s.dayLabel"
              :value="s.id"
            />
          </el-select>
          <div v-else style="font-size:13px; color:#aaa; padding-top:8px;">No sessions yet</div>
        </el-col>
      </el-row>

      <!-- Day selector -->
      <div class="section-title">Select Day</div>
      <div class="day-grid">
        <div
          v-for="n in 6"
          :key="n"
          :class="['day-btn', `day-${n}`, { active: selectedDay === n }]"
          :style="{ '--day-color': plan[n].color }"
          @click="selectDay(n)"
        >
          <div class="day-num">Day {{ n }}</div>
          <div class="day-label">{{ plan[n].label }}</div>
        </div>
        <div
          :class="['day-btn', { active: selectedDay === 'custom' }]"
          style="--day-color:#fd79a8;"
          @click="selectDay('custom')"
        >
          <div class="day-num" style="color:inherit;">Custom</div>
          <div class="day-label">New workout</div>
        </div>
      </div>

      <el-input
        v-if="selectedDay === 'custom'"
        v-model="customLabel"
        placeholder="Workout name e.g. Full Body"
        size="large"
        style="margin-bottom:16px;"
        @keyup.enter="startSession"
      />

      <el-button
        type="primary"
        size="large"
        style="width:100%; margin-bottom:20px;"
        :disabled="!selectedDay"
        @click="startSession"
      >
        Start Logging
      </el-button>
    </template>

    <!-- Active session -->
    <template v-if="session">
      <div v-if="!editMode" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <div>
          <div style="font-size:18px; font-weight:800; color:#1a1a2e;">{{ session.dayLabel }}</div>
          <div style="font-size:13px; color:#aaa;">{{ session.date }}</div>
        </div>
        <el-tag :style="{ background: dayColor, borderColor: dayColor, color: '#fff' }" v-if="session.dayNumber">
          Day {{ session.dayNumber }}
        </el-tag>
        <el-tag type="info" v-else>Custom</el-tag>
      </div>

      <!-- Exercises -->
      <div class="section-title">Exercises</div>

      <div v-for="(ex, exIdx) in session.exercises" :key="ex.id" class="exercise-card">
        <!-- Header -->
        <div class="exercise-card-header" @click="toggleExpand(ex.id)">
          <div class="exercise-name-row">
            <el-icon
              style="color:#aaa; transition:transform 0.2s;"
              :style="{ transform: expanded.has(ex.id) ? 'rotate(90deg)' : '' }"
            ><ArrowRight /></el-icon>
            <span class="exercise-name">{{ ex.name }}</span>
            <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">
              {{ ex.type || 'Custom' }}
            </el-tag>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:12px; color:#aaa;">{{ completedSets(ex) }}/{{ ex.sets.length }}</span>
            <el-button
              type="danger" :icon="Delete" circle plain size="small"
              @click.stop="removeExercise(exIdx)"
            />
          </div>
        </div>

        <!-- Body -->
        <div v-show="expanded.has(ex.id)" class="exercise-body">
          <div v-if="ex.tip" class="exercise-tip">💡 {{ ex.tip }}</div>
          <div v-if="ex.repsTarget" style="font-size:12px; color:#aaa; padding-bottom:6px;">
            Target: {{ ex.sets.length }} sets × {{ ex.repsTarget }} reps
          </div>

          <!-- Set header -->
          <div class="set-header">
            <div>#</div>
            <div>Reps</div>
            <div>Weight (kg)</div>
            <div></div>
          </div>

          <!-- Set rows -->
          <div v-for="(set, setIdx) in ex.sets" :key="set.id" class="set-row">
            <div :class="['set-num', { completed: isSetDone(set) }]">{{ setIdx + 1 }}</div>
            <el-input
              v-model="set.reps"
              placeholder="–"
              class="set-input"
              size="small"
              @input="(v) => onRepsInput(set, v)"
            />
            <el-input
              v-model="set.weight"
              placeholder="–"
              class="set-input"
              size="small"
            />
            <el-button
              :icon="Close" circle plain size="small" type="info"
              @click="removeSet(ex, setIdx)"
            />
          </div>

          <!-- Set actions -->
          <div class="set-actions">
            <el-button size="small" :icon="Plus" plain @click="addSet(ex)">Add Set</el-button>
            <span style="font-size:12px; color:#aaa;">
              {{ completedSets(ex) }} completed
            </span>
          </div>
        </div>
      </div>

      <!-- Add exercise -->
      <el-button
        style="width:100%; margin-bottom:16px; border-style:dashed;"
        size="large"
        :icon="Plus"
        @click="showAddExDialog = true"
      >
        Add Exercise
      </el-button>

      <!-- Cardio section -->
      <div class="section-title">Cardio (optional)</div>
      <div class="cardio-card">
        <div class="cardio-row">
          <div class="cardio-label">
            <span style="font-size:20px;">🏃</span>
            <span>Treadmill</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <el-input-number
              v-if="session.cardio.treadmill.done"
              v-model="session.cardio.treadmill.duration"
              :min="1" :max="120" :step="5"
              controls-position="right"
              size="small"
              style="width:90px;"
            />
            <span v-if="session.cardio.treadmill.done" style="font-size:12px; color:#aaa;">min</span>
            <el-switch v-model="session.cardio.treadmill.done" />
          </div>
        </div>
        <el-divider style="margin:6px 0;" />
        <div class="cardio-row">
          <div class="cardio-label">
            <span style="font-size:20px;">🚴</span>
            <span>Cycling</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <el-input-number
              v-if="session.cardio.cycling.done"
              v-model="session.cardio.cycling.duration"
              :min="1" :max="120" :step="5"
              controls-position="right"
              size="small"
              style="width:90px;"
            />
            <span v-if="session.cardio.cycling.done" style="font-size:12px; color:#aaa;">min</span>
            <el-switch v-model="session.cardio.cycling.done" />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="section-title">Notes</div>
      <el-input
        v-model="session.notes"
        type="textarea"
        :rows="3"
        placeholder="How did it feel? Any PRs?"
        style="margin-bottom:20px;"
      />

      <!-- Save / Cancel -->
      <div style="display:flex; gap:10px; margin-bottom:8px;">
        <el-button v-if="editMode" @click="$emit('cancel')" style="flex:1;">Cancel</el-button>
        <el-button type="primary" size="large" :loading="saving" @click="saveSession" style="flex:2;">
          <template #icon><el-icon><Check /></el-icon></template>
          {{ editMode ? 'Update Session' : 'Save Workout' }}
        </el-button>
      </div>
    </template>

    <!-- Add Exercise Dialog -->
    <el-dialog
      v-model="showAddExDialog"
      title="Add Exercise"
      width="92%"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <el-tabs v-model="addExTab">
        <!-- From Plan -->
        <el-tab-pane label="From Plan" name="plan">
          <el-input
            v-model="exSearch"
            placeholder="Search exercises…"
            :prefix-icon="Search"
            clearable
            style="margin-bottom:12px;"
          />
          <div style="max-height:320px; overflow-y:auto;">
            <div
              v-for="ex in filteredPlanExercises"
              :key="ex.name"
              style="display:flex; align-items:center; justify-content:space-between; padding:10px 4px; border-bottom:1px solid #f5f5f5; cursor:pointer;"
              @click="addFromPlan(ex)"
            >
              <div>
                <div style="font-size:14px; font-weight:600;">{{ ex.name }}</div>
                <div style="font-size:12px; color:#aaa;">{{ ex.dayLabel }} · {{ ex.sets }} × {{ ex.repsTarget }}</div>
              </div>
              <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">{{ ex.type }}</el-tag>
            </div>
            <el-empty v-if="!filteredPlanExercises.length" description="No matches" :image-size="60" />
          </div>
        </el-tab-pane>

        <!-- Manual -->
        <el-tab-pane label="Manual" name="manual">
          <el-form label-position="top">
            <el-form-item label="Name" required>
              <el-input v-model="manualEx.name" placeholder="Exercise name" />
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
            style="width:100%;"
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
import { ArrowLeft, ArrowRight, Delete, Plus, Close, Check, Search } from '@element-plus/icons-vue';
import {
  sessionFromPlan, newCustomSession, makeSets, uid, today, deepClone,
} from '../data/workoutPlan.js';

const props = defineProps({
  plan: Object,
  sessions: Array,
  editSession: Object,   // pre-loaded session to edit
});
const emit = defineEmits(['save', 'cancel']);

// ── State ──────────────────────────────────────────────────────────────────
const selectedDate = ref(today());
const selectedDay = ref(null);
const customLabel = ref('');
const loadSessionId = ref(null);
const session = ref(props.editSession ? deepClone(props.editSession) : null);
const editMode = computed(() => !!props.editSession);
const saving = ref(false);
const expanded = ref(new Set());
const showAddExDialog = ref(false);
const addExTab = ref('plan');
const exSearch = ref('');
const manualEx = ref({ name: '', type: 'Isolation', sets: 3, repsTarget: '10', tip: '' });

// ── Computed ───────────────────────────────────────────────────────────────
const dayColor = computed(() => {
  if (session.value?.dayNumber) return props.plan[session.value.dayNumber]?.color || '#6c5ce7';
  return '#fd79a8';
});

const sessionsOnDate = computed(() =>
  props.sessions.filter((s) => s.date === selectedDate.value)
);

const allPlanExercises = computed(() => {
  const list = [];
  Object.entries(props.plan).forEach(([dayNum, day]) => {
    day.exercises.forEach((ex) => {
      list.push({ ...ex, dayLabel: `Day ${dayNum}` });
    });
  });
  return list;
});

const filteredPlanExercises = computed(() => {
  const q = exSearch.value.toLowerCase();
  return q ? allPlanExercises.value.filter((e) => e.name.toLowerCase().includes(q)) : allPlanExercises.value;
});

// ── Methods ────────────────────────────────────────────────────────────────
function onDateChange() {
  loadSessionId.value = null;
}

function loadSession(id) {
  if (!id) return;
  const found = props.sessions.find((s) => s.id === id);
  if (found) session.value = deepClone(found);
}

function selectDay(n) {
  selectedDay.value = n;
  session.value = null; // reset until user clicks Start
}

function startSession() {
  if (!selectedDay.value) return;
  if (selectedDay.value === 'custom') {
    session.value = newCustomSession(selectedDate.value, customLabel.value);
  } else {
    session.value = sessionFromPlan(selectedDay.value, props.plan, selectedDate.value);
  }
  // auto-expand all exercises
  expanded.value = new Set(session.value.exercises.map((e) => e.id));
}

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}

function completedSets(ex) {
  return ex.sets.filter((s) => isSetDone(s)).length;
}

function isSetDone(set) {
  return String(set.reps).trim() !== '' && String(set.reps).trim() !== '0';
}

function onRepsInput(set, v) {
  set.reps = v;
}

function addSet(ex) {
  ex.sets.push({ id: uid(), reps: '', weight: '' });
}

function removeSet(ex, idx) {
  if (ex.sets.length <= 1) return;
  ex.sets.splice(idx, 1);
}

function removeExercise(idx) {
  session.value.exercises.splice(idx, 1);
}

function addFromPlan(planEx) {
  const ex = {
    id: uid(),
    name: planEx.name,
    type: planEx.type,
    tip: planEx.tip,
    repsTarget: planEx.repsTarget,
    isCustom: false,
    sets: makeSets(planEx.sets),
  };
  session.value.exercises.push(ex);
  expanded.value = new Set([...expanded.value, ex.id]);
  showAddExDialog.value = false;
  exSearch.value = '';
}

function addManualExercise() {
  if (!manualEx.value.name.trim()) return;
  const ex = {
    id: uid(),
    name: manualEx.value.name.trim(),
    type: manualEx.value.type,
    tip: manualEx.value.tip,
    repsTarget: manualEx.value.repsTarget,
    isCustom: true,
    sets: makeSets(manualEx.value.sets),
  };
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
    ElMessage.success('Workout saved!');
    if (!editMode.value) {
      // Reset for next log
      session.value = null;
      selectedDay.value = null;
      customLabel.value = '';
      loadSessionId.value = null;
    }
  } finally {
    saving.value = false;
  }
}

// If editSession prop changes, load it
watch(() => props.editSession, (v) => {
  if (v) {
    session.value = deepClone(v);
    expanded.value = new Set(session.value.exercises.map((e) => e.id));
  }
}, { immediate: true });
</script>
