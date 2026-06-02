<template>
  <div class="fade-up">
    <!-- Page header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
      <div>
        <div class="page-title">Weekly Plan</div>
        <div class="page-subtitle">6-day split · tap Edit to customise any day</div>
      </div>
    </div>

    <!-- Day blocks -->
    <div v-for="(day, dayNum) in plan" :key="dayNum" class="plan-block">

      <!-- Day label row -->
      <div class="plan-day-row" :style="{ borderLeftColor: day.color }">
        <div class="plan-day-info">
          <span class="plan-day-pill" :style="{ background: day.color }">Day {{ dayNum }}</span>
          <span class="plan-day-name">{{ day.label }}</span>
        </div>
        <el-button size="small" plain @click="openEdit(dayNum)" style="border-radius:8px; font-weight:600;">
          <el-icon style="margin-right:3px;"><Edit /></el-icon>Edit
        </el-button>
      </div>

      <!-- Exercise list -->
      <div class="plan-ex-list">
        <div
          v-for="ex in day.exercises"
          :key="ex.name"
          class="plan-ex-item"
        >
          <div class="plan-ex-name">{{ ex.name }}</div>
          <div class="plan-ex-right">
            <span class="plan-ex-sets">{{ ex.sets }}×{{ ex.repsTarget }}</span>
            <span
              class="muscle-tag"
              :style="{ background: muscleStyle(ex.muscle).bg, color: muscleStyle(ex.muscle).color, borderColor: muscleStyle(ex.muscle).border }"
            >{{ ex.muscle || '—' }}</span>
          </div>
        </div>

        <!-- Coach tip -->
        <div v-if="day.coachTip" class="plan-coach-tip">
          <span>💡</span><span>{{ day.coachTip }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Drawer -->
    <el-drawer
      v-model="drawerOpen"
      direction="btt"
      size="92%"
      :destroy-on-close="false"
    >
      <template #header>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:12px; height:12px; border-radius:50%;" :style="{ background: editDayData?.color }" />
          <span>Day {{ editingDayNum }} — {{ editDayData?.label }}</span>
        </div>
      </template>

      <div v-if="editDayData" style="padding:16px; overflow-y:auto; height:calc(100% - 56px); padding-bottom:84px;">

        <!-- Day meta -->
        <div style="background:var(--surface); border-radius:var(--radius-md); padding:14px; margin-bottom:16px;">
          <el-form label-position="top" size="default">
            <el-row :gutter="10">
              <el-col :span="18">
                <el-form-item label="Day label" style="margin-bottom:10px;">
                  <el-input v-model="editDayData.label" placeholder="e.g. Chest · Shoulder" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Colour" style="margin-bottom:10px;">
                  <el-color-picker v-model="editDayData.color" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Coach tip" style="margin-bottom:0;">
              <el-input v-model="editDayData.coachTip" type="textarea" :rows="2" placeholder="Optional coaching note…" />
            </el-form-item>
          </el-form>
        </div>

        <!-- Exercises -->
        <div class="section-title">Exercises ({{ editDayData.exercises.length }})</div>

        <div
          v-for="(ex, idx) in editDayData.exercises"
          :key="idx"
          style="background:#fff; border:1px solid var(--border); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:10px; box-shadow:var(--shadow-sm);"
        >
          <!-- Row 1: number + name + delete -->
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <div style="width:22px; height:22px; border-radius:6px; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:var(--primary); flex-shrink:0;">
              {{ idx + 1 }}
            </div>
            <el-input v-model="ex.name" placeholder="Exercise name" style="flex:1;" size="small" />
            <el-button type="danger" :icon="Delete" circle plain size="small" @click="removeExercise(idx)" />
          </div>

          <!-- Row 2: muscle, sets, reps, type -->
          <el-row :gutter="8">
            <el-col :span="8">
              <div class="edit-label">Muscle</div>
              <el-select v-model="ex.muscle" size="small" style="width:100%;" placeholder="Muscle">
                <el-option v-for="m in muscleOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <div class="edit-label">Sets</div>
              <el-input-number v-model="ex.sets" :min="1" :max="10" controls-position="right" size="small" style="width:100%;" />
            </el-col>
            <el-col :span="5">
              <div class="edit-label">Reps</div>
              <el-input v-model="ex.repsTarget" placeholder="10" size="small" />
            </el-col>
            <el-col :span="6">
              <div class="edit-label">Type</div>
              <el-select v-model="ex.type" size="small" style="width:100%;">
                <el-option label="Compound" value="Compound" />
                <el-option label="Isolation" value="Isolation" />
              </el-select>
            </el-col>
          </el-row>

          <!-- Tip -->
          <el-input v-model="ex.tip" placeholder="💡 Coaching tip (optional)" size="small" style="margin-top:8px;" />
        </div>

        <!-- Add new -->
        <div style="display:flex; gap:8px; margin-top:4px;">
          <el-input v-model="newExName" placeholder="New exercise name…" size="default" @keyup.enter="addExercise" />
          <el-button type="primary" :icon="Plus" @click="addExercise" :disabled="!newExName.trim()">Add</el-button>
        </div>
      </div>

      <!-- Sticky footer -->
      <div style="position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--border); padding:12px 16px; display:flex; gap:10px; z-index:100;">
        <el-button @click="drawerOpen = false" style="flex:1;">Cancel</el-button>
        <el-button type="primary" @click="saveDay" style="flex:2; font-weight:700;">Save Changes</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Edit, Delete, Plus } from '@element-plus/icons-vue';
import { deepClone, muscleStyle, MUSCLE_COLORS } from '../data/workoutPlan.js';

const props = defineProps({ plan: Object });
const emit  = defineEmits(['update-plan']);

const drawerOpen     = ref(false);
const editingDayNum  = ref(null);
const editDayData    = ref(null);
const newExName      = ref('');

const muscleOptions = Object.keys(MUSCLE_COLORS);

function openEdit(dayNum) {
  editingDayNum.value = dayNum;
  editDayData.value   = deepClone(props.plan[dayNum]);
  newExName.value     = '';
  drawerOpen.value    = true;
}

function addExercise() {
  if (!newExName.value.trim()) return;
  editDayData.value.exercises.push({
    name: newExName.value.trim(),
    muscle: '',
    sets: 3,
    repsTarget: '10',
    type: 'Isolation',
    tip: '',
  });
  newExName.value = '';
}

function removeExercise(idx) {
  editDayData.value.exercises.splice(idx, 1);
}

function saveDay() {
  const updated = deepClone(props.plan);
  updated[editingDayNum.value] = editDayData.value;
  emit('update-plan', updated);
  drawerOpen.value = false;
}
</script>

<style scoped>
/* ── Plan block ── */
.plan-block {
  background: #fff;
  border-radius: var(--radius-lg);
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

/* ── Day label row ── */
.plan-day-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-left: 4px solid transparent;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.plan-day-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.plan-day-pill {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  border-radius: 20px;
  padding: 3px 10px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.plan-day-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Exercise list ── */
.plan-ex-list { padding: 0; }

.plan-ex-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
  transition: background 0.1s;
}

.plan-ex-item:last-of-type { border-bottom: none; }
.plan-ex-item:hover { background: #fafbff; }

.plan-ex-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-1);
  flex: 1;
  min-width: 0;
}

.plan-ex-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.plan-ex-sets {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  white-space: nowrap;
}

.muscle-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 20px;
  border: 1px solid;
  white-space: nowrap;
}

/* ── Coach tip ── */
.plan-coach-tip {
  display: flex;
  gap: 6px;
  padding: 9px 16px;
  background: #fffbeb;
  border-top: 1px solid #fde68a;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
}

/* ── Edit drawer labels ── */
.edit-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
</style>
