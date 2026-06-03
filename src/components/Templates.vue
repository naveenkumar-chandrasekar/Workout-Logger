<template>
  <div class="fade-up">

    <!-- Header -->
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px;">
      <div>
        <div class="page-title">Workout Templates</div>
        <div class="page-subtitle">Save any session as a reusable template · {{ templates.length }} saved</div>
      </div>
      <el-button type="primary" :icon="Plus" style="border-radius:10px; font-weight:700;" @click="openCreateDialog">
        New Template
      </el-button>
    </div>

    <!-- Empty state -->
    <div v-if="!templates.length" class="empty-state" style="margin-top:60px;">
      <div class="empty-icon">📄</div>
      <div class="empty-title">No templates yet</div>
      <div class="empty-desc">
        Save a session as a template while logging, or create one from scratch with the button above.
      </div>
      <el-button type="primary" :icon="Plus" style="margin-top:20px; border-radius:10px; font-weight:700;" @click="openCreateDialog">
        Create Template
      </el-button>
    </div>

    <!-- Templates grid -->
    <div v-else class="templates-grid">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="tpl-card"
      >
        <!-- Header -->
        <div class="tpl-card-header">
          <div style="flex:1; min-width:0;">
            <div class="tpl-name">{{ tpl.name }}</div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:5px; flex-wrap:wrap;">
              <el-tag
                v-for="m in tpl.muscles.slice(0,3)"
                :key="m"
                size="small"
                effect="plain"
                style="font-size:10px;"
              >{{ m }}</el-tag>
            </div>
          </div>
          <el-dropdown @command="(cmd) => handleTplCmd(cmd, tpl)" trigger="click" @click.stop>
            <el-button :icon="MoreFilled" circle plain size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit"><el-icon><Edit /></el-icon> Edit name</el-dropdown-item>
                <el-dropdown-item command="delete" divided><el-icon><Delete /></el-icon> Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Stats row -->
        <div class="tpl-stats-row">
          <div class="tpl-stat">
            <div class="tpl-stat-val">{{ tpl.exercises.length }}</div>
            <div class="tpl-stat-key">Exercises</div>
          </div>
          <div class="tpl-stat-div" />
          <div class="tpl-stat">
            <div class="tpl-stat-val">{{ totalSetsInTpl(tpl) }}</div>
            <div class="tpl-stat-key">Total sets</div>
          </div>
          <div class="tpl-stat-div" />
          <div class="tpl-stat">
            <div class="tpl-stat-val">{{ tpl.usedCount || 0 }}</div>
            <div class="tpl-stat-key">Times used</div>
          </div>
        </div>

        <!-- Exercise list preview -->
        <div class="tpl-ex-list">
          <div v-for="ex in tpl.exercises.slice(0, 5)" :key="ex.name" class="tpl-ex-row">
            <span
              class="tpl-ex-dot"
              :style="{ background: ex.muscle ? muscleStyle(ex.muscle).color : '#aaa' }"
            />
            <span class="tpl-ex-name">{{ ex.name }}</span>
            <span class="tpl-ex-meta">{{ ex.sets }}×{{ ex.repsTarget }}</span>
          </div>
          <div v-if="tpl.exercises.length > 5" class="tpl-ex-row" style="color:var(--text-3); font-style:italic;">
            + {{ tpl.exercises.length - 5 }} more exercises
          </div>
        </div>

        <!-- Footer actions -->
        <div class="tpl-card-footer">
          <span style="font-size:11px; color:var(--text-3);">
            Created {{ formatDate(tpl.createdAt) }}
          </span>
          <el-button
            type="primary"
            size="small"
            style="border-radius:8px; font-weight:700;"
            @click="loadTemplate(tpl)"
          >
            Use Template →
          </el-button>
        </div>
      </div>
    </div>

    <!-- Create / Edit dialog -->
    <el-dialog
      v-model="createDialogOpen"
      :title="editingTpl ? 'Edit Template' : 'New Template'"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div style="display:flex; flex-direction:column; gap:0; max-height:60vh; overflow:hidden;">

      <el-form label-position="top" style="flex-shrink:0;">
        <el-form-item label="Template name" required style="margin-bottom:12px;">
          <el-input v-model="form.name" placeholder="e.g. Push Day A, Upper Hypertrophy…" size="large" />
        </el-form-item>
      </el-form>

      <div style="flex-shrink:0; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <span class="section-title" style="margin-bottom:0;">Exercises ({{ form.exercises.length }})</span>
        <el-button :icon="Plus" size="small" plain style="border-radius:8px;" @click="addExToForm">Add exercise</el-button>
      </div>

      <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding-right:4px; min-height:60px;">
        <div
          v-for="(ex, idx) in form.exercises"
          :key="idx"
          style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px 14px;"
        >
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <div style="width:22px; height:22px; border-radius:6px; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:var(--primary); flex-shrink:0;">
              {{ idx+1 }}
            </div>
            <el-input v-model="ex.name" placeholder="Exercise name" style="flex:1;" size="small" />
            <el-button type="danger" :icon="Delete" plain size="small" circle @click="form.exercises.splice(idx,1)" />
          </div>
          <el-row :gutter="8">
            <el-col :span="7">
              <div class="edit-label">Muscle</div>
              <el-select v-model="ex.muscle" size="small" style="width:100%;" placeholder="—">
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
            <el-col :span="7">
              <div class="edit-label">Type</div>
              <el-select v-model="ex.type" size="small" style="width:100%;">
                <el-option label="Compound" value="Compound" />
                <el-option label="Isolation" value="Isolation" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <div v-if="!form.exercises.length" style="padding:20px; text-align:center; color:var(--text-3); font-size:13px;">
          No exercises added yet.
        </div>
      </div>
      </div><!-- end flex wrapper -->

      <template #footer>
        <el-button @click="createDialogOpen = false">Cancel</el-button>
        <el-button type="primary" :disabled="!form.name.trim()" style="font-weight:700;" @click="saveTemplate">
          {{ editingTpl ? 'Save Changes' : 'Create Template' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, MoreFilled } from '@element-plus/icons-vue';
import { muscleStyle, MUSCLE_COLORS, uid } from '../data/workoutPlan.js';

const props = defineProps({ modelValue: Array, plan: Object });
const emit  = defineEmits(['update:modelValue', 'load-template']);

const templates = computed(() => props.modelValue || []);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(d) {
  if (!d) return '—';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m)-1]} ${y}`;
}

const muscleOptions = Object.keys(MUSCLE_COLORS);

function totalSetsInTpl(tpl) {
  return tpl.exercises.reduce((a, ex) => a + (Number(ex.sets) || 0), 0);
}

// ── Create / Edit dialog ───────────────────────────────────────────────────
const createDialogOpen = ref(false);
const editingTpl       = ref(null);
const form             = ref({ name: '', exercises: [] });

function openCreateDialog() {
  editingTpl.value = null;
  form.value = { name: '', exercises: [] };
  createDialogOpen.value = true;
}

function addExToForm() {
  form.value.exercises.push({ name: '', muscle: '', sets: 3, repsTarget: '10', type: 'Isolation', tip: '' });
}

function saveTemplate() {
  if (!form.value.name.trim()) return;

  const muscles = [...new Set(form.value.exercises.map(e => e.muscle).filter(Boolean))];
  const updated = [...templates.value];

  if (editingTpl.value) {
    const idx = updated.findIndex(t => t.id === editingTpl.value.id);
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], name: form.value.name.trim(), exercises: form.value.exercises, muscles };
    }
  } else {
    updated.push({
      id:        uid(),
      name:      form.value.name.trim(),
      exercises: form.value.exercises,
      muscles,
      createdAt: new Date().toISOString().slice(0, 10),
      usedCount: 0,
    });
  }

  emit('update:modelValue', updated);
  createDialogOpen.value = false;
  ElMessage.success(editingTpl.value ? 'Template updated!' : 'Template created!');
}

function handleTplCmd(cmd, tpl) {
  if (cmd === 'edit') {
    editingTpl.value = tpl;
    form.value = { name: tpl.name, exercises: JSON.parse(JSON.stringify(tpl.exercises)) };
    createDialogOpen.value = true;
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`Delete "${tpl.name}"?`, 'Confirm', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }).then(() => {
      emit('update:modelValue', templates.value.filter(t => t.id !== tpl.id));
      ElMessage.success('Template deleted');
    }).catch(() => {});
  }
}

function loadTemplate(tpl) {
  // bump usedCount
  const updated = templates.value.map(t =>
    t.id === tpl.id ? { ...t, usedCount: (t.usedCount || 0) + 1 } : t
  );
  emit('update:modelValue', updated);
  emit('load-template', tpl);
  ElMessage.success(`Template "${tpl.name}" loaded into Log Workout`);
}
</script>

<style scoped>
.templates-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) { .templates-grid { grid-template-columns: repeat(2, 1fr); } }

.tpl-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: all 0.18s;
}

.tpl-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.tpl-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 16px 12px;
  gap: 10px;
}

.tpl-name { font-size: 15px; font-weight: 800; color: var(--text-1); line-height: 1.3; }

.tpl-stats-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.tpl-stat     { flex: 1; text-align: center; }
.tpl-stat-val { font-size: 20px; font-weight: 800; color: var(--text-1); line-height: 1; }
.tpl-stat-key { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
.tpl-stat-div { width: 1px; height: 32px; background: var(--border); }

.tpl-ex-list { padding: 8px 0; flex: 1; }

.tpl-ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}

.tpl-ex-row:last-child { border-bottom: none; }
.tpl-ex-row:hover { background: #fafbff; }

.tpl-ex-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tpl-ex-name { font-size: 12.5px; font-weight: 600; color: var(--text-1); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpl-ex-meta { font-size: 11px; color: var(--text-3); flex-shrink: 0; }

.tpl-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  margin-top: auto;
}

.edit-label { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
</style>
