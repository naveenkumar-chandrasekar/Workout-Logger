<template>
  <div>
    <!-- Header row -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div>
        <div style="font-size:20px; font-weight:800; color:#1a1a2e;">Your Plan</div>
        <div style="font-size:13px; color:#aaa; margin-top:2px;">6-day split · tap a day to edit</div>
      </div>
    </div>

    <!-- Day cards -->
    <div v-for="(day, dayNum) in plan" :key="dayNum" class="plan-day-card">
      <!-- Coloured header -->
      <div class="plan-day-header" :style="{ background: day.color }">
        <div>
          <div class="day-title">Day {{ dayNum }} — {{ day.label }}</div>
          <div class="day-subtitle">{{ day.muscles.join(' · ') }}</div>
        </div>
        <el-button size="small" plain @click="openEdit(dayNum)"
          style="border-color:rgba(255,255,255,0.5); color:#fff; background:rgba(255,255,255,0.15);">
          <el-icon><Edit /></el-icon> Edit
        </el-button>
      </div>

      <!-- Exercise list -->
      <div style="background:#fff;">
        <div v-for="ex in day.exercises" :key="ex.name" class="plan-exercise-row">
          <div>
            <div class="plan-ex-name">{{ ex.name }}</div>
            <div class="plan-ex-meta">{{ ex.sets }} sets × {{ ex.repsTarget }} reps</div>
          </div>
          <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">
            {{ ex.type }}
          </el-tag>
        </div>

        <!-- Coach tip -->
        <div v-if="day.coachTip" style="padding:10px 16px; background:#fafbff; border-top:1px solid #f0f2f8;">
          <span style="font-size:12px; color:#888;">💡 {{ day.coachTip }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Day Drawer -->
    <el-drawer
      v-model="drawerOpen"
      :title="`Edit Day ${editingDayNum}`"
      direction="btt"
      size="90%"
      :destroy-on-close="false"
    >
      <template #header>
        <div style="display:flex; align-items:center; gap:10px;">
          <div :style="{ width:'10px', height:'10px', borderRadius:'50%', background: editDayData?.color }" />
          <span style="font-weight:700; font-size:16px;">Day {{ editingDayNum }} — {{ editDayData?.label }}</span>
        </div>
      </template>

      <div v-if="editDayData" style="padding:16px; overflow-y:auto; height:calc(100% - 60px);">
        <!-- Day label & color -->
        <el-form label-position="top" size="default">
          <el-row :gutter="12">
            <el-col :span="18">
              <el-form-item label="Day label">
                <el-input v-model="editDayData.label" placeholder="e.g. Chest · Shoulder · Triceps" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="Color">
                <el-color-picker v-model="editDayData.color" size="default" style="width:100%;" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Coach tip">
            <el-input v-model="editDayData.coachTip" type="textarea" :rows="2" placeholder="Optional coaching note…" />
          </el-form-item>
        </el-form>

        <div class="section-title" style="margin-top:8px;">Exercises</div>

        <!-- Exercise rows -->
        <div v-for="(ex, idx) in editDayData.exercises" :key="idx"
          style="border:1px solid #eef0f5; border-radius:10px; padding:12px; margin-bottom:10px; background:#fff;">
          <div style="display:flex; gap:8px; align-items:flex-start;">
            <el-input v-model="ex.name" placeholder="Exercise name" style="flex:1;" />
            <el-button type="danger" :icon="Delete" circle plain size="small" @click="removeExercise(idx)" />
          </div>
          <el-row :gutter="8" style="margin-top:8px;">
            <el-col :span="6">
              <div style="font-size:11px; color:#aaa; margin-bottom:3px;">Sets</div>
              <el-input-number v-model="ex.sets" :min="1" :max="10" controls-position="right" style="width:100%;" size="small" />
            </el-col>
            <el-col :span="8">
              <div style="font-size:11px; color:#aaa; margin-bottom:3px;">Reps target</div>
              <el-input v-model="ex.repsTarget" placeholder="10" size="small" />
            </el-col>
            <el-col :span="10">
              <div style="font-size:11px; color:#aaa; margin-bottom:3px;">Type</div>
              <el-select v-model="ex.type" size="small" style="width:100%;">
                <el-option label="Compound" value="Compound" />
                <el-option label="Isolation" value="Isolation" />
              </el-select>
            </el-col>
          </el-row>
          <el-input v-model="ex.tip" placeholder="Coaching tip (optional)" size="small" style="margin-top:8px;"
            :prefix-icon="InfoFilled" />
        </div>

        <!-- Add exercise -->
        <div style="display:flex; gap:8px; margin-top:4px; margin-bottom:80px;">
          <el-input v-model="newExName" placeholder="New exercise name…" @keyup.enter="addExercise" />
          <el-button type="primary" :icon="Plus" @click="addExercise" :disabled="!newExName.trim()">Add</el-button>
        </div>
      </div>

      <!-- Footer actions -->
      <div style="position:sticky; bottom:0; background:#fff; border-top:1px solid #eef0f5; padding:12px 16px; display:flex; gap:8px;">
        <el-button @click="drawerOpen = false" style="flex:1;">Cancel</el-button>
        <el-button type="primary" @click="saveDay" style="flex:2;">Save Day</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Edit, Delete, Plus, InfoFilled } from '@element-plus/icons-vue';
import { deepClone, uid } from '../data/workoutPlan.js';

const props = defineProps({ plan: Object });
const emit = defineEmits(['update-plan']);

const drawerOpen = ref(false);
const editingDayNum = ref(null);
const editDayData = ref(null);
const newExName = ref('');

function openEdit(dayNum) {
  editingDayNum.value = dayNum;
  editDayData.value = deepClone(props.plan[dayNum]);
  newExName.value = '';
  drawerOpen.value = true;
}

function addExercise() {
  if (!newExName.value.trim()) return;
  editDayData.value.exercises.push({
    name: newExName.value.trim(),
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
