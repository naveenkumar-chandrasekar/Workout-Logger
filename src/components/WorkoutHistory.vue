<template>
  <div class="fade-up">
    <!-- Page header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
      <div>
        <div class="page-title">Workout History</div>
        <div class="page-subtitle">{{ sessions.length }} sessions · {{ totalSetsAll }} sets · {{ uniqueDays }} training days</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <el-input
          v-model="searchExercise"
          placeholder="Search by exercise…"
          :prefix-icon="Search"
          clearable
          style="width:220px;"
        />
        <el-select v-model="filterDay" placeholder="All days" clearable style="width:180px;">
          <el-option v-for="n in 6" :key="n" :label="`Day ${n} — ${plan[n]?.label}`" :value="n" />
          <el-option label="Custom workouts" value="custom" />
        </el-select>
        <el-button :icon="Download" style="border-radius:10px; font-weight:700;" @click="exportDialogOpen = true">
          Export Excel
        </el-button>
      </div>
    </div>

    <!-- Export dialog -->
    <el-dialog v-model="exportDialogOpen" title="Export Workout Data" width="440px" destroy-on-close>
      <div style="display:flex; flex-direction:column; gap:16px;">
        <el-alert type="info" :closable="false" show-icon>
          Downloads an Excel file with 4 sheets: Sessions, Sets, Cardio, Body Weight.
        </el-alert>
        <el-form label-position="top">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="From date">
                <el-date-picker v-model="exportFrom" type="date" format="DD MMM YYYY" value-format="YYYY-MM-DD" placeholder="All time" style="width:100%;" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="To date">
                <el-date-picker v-model="exportTo" type="date" format="DD MMM YYYY" value-format="YYYY-MM-DD" placeholder="Today" style="width:100%;" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div style="background:var(--surface); border-radius:var(--radius-md); padding:12px 14px; font-size:13px; color:var(--text-2);">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Sessions to export</span>
            <strong>{{ exportCount }}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Total sets</span>
            <strong>{{ exportSets }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogOpen = false">Cancel</el-button>
        <el-button type="primary" :icon="Download" style="font-weight:700;" @click="doExport">
          Download Excel
        </el-button>
      </template>
    </el-dialog>

    <!-- Summary stats bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-card-val">{{ sessions.length }}</div>
        <div class="stat-card-key">Total Sessions</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-card">
        <div class="stat-card-val">{{ totalSetsAll }}</div>
        <div class="stat-card-key">Sets Logged</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-card">
        <div class="stat-card-val">{{ uniqueDays }}</div>
        <div class="stat-card-key">Training Days</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-card">
        <div class="stat-card-val">{{ cardioSessions }}</div>
        <div class="stat-card-key">Cardio Sessions</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-card">
        <div class="stat-card-val">{{ thisWeekCount }}</div>
        <div class="stat-card-key">This Week</div>
      </div>
    </div>

    <!-- Search result notice -->
    <div v-if="searchExercise.trim() && filteredSessions.length"
      style="display:flex; align-items:center; gap:8px; margin-bottom:14px; padding:10px 14px; background:var(--primary-light); border-radius:var(--radius-md); font-size:13px; color:var(--primary);">
      <el-icon><Search /></el-icon>
      <span>Found <strong>{{ filteredSessions.length }}</strong> session{{ filteredSessions.length !== 1 ? 's' : '' }} containing "<strong>{{ searchExercise.trim() }}</strong>"</span>
      <el-button size="small" text style="margin-left:auto; color:var(--primary);" @click="searchExercise = ''">Clear</el-button>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredSessions.length" class="empty-state" style="margin-top:60px;">
      <div class="empty-icon">{{ searchExercise.trim() ? '🔍' : '📋' }}</div>
      <div class="empty-title">{{ searchExercise.trim() ? 'No sessions found' : 'No sessions yet' }}</div>
      <div class="empty-desc">{{ searchExercise.trim() ? `No sessions contain "${searchExercise.trim()}"` : 'Go to Log Workout to record your first session.' }}</div>
      <el-button v-if="searchExercise.trim()" size="small" plain style="margin-top:12px;" @click="searchExercise = ''">Clear search</el-button>
    </div>

    <!-- Data table -->
    <div v-else class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th style="width:130px;">Date</th>
            <th>Workout</th>
            <th style="width:100px; text-align:center;">Day</th>
            <th style="width:100px; text-align:center;">Exercises</th>
            <th style="width:80px; text-align:center;">Sets</th>
            <th style="width:90px; text-align:center;">Cardio</th>
            <th style="width:130px; text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, month) in groupedSessions" :key="month">
            <!-- Month group row -->
            <tr class="month-row">
              <td colspan="7">{{ month }}</td>
            </tr>

            <!-- Session rows -->
            <template v-for="s in group" :key="s.id">
              <tr class="session-tr" @click="toggleExpand(s.id)" :class="{ expanded: expanded.has(s.id) }">
                <td>
                  <span style="font-size:13px; font-weight:600; color:var(--text-2);">{{ formatDate(s.date) }}</span>
                </td>
                <td>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="color-dot" :style="{ background: dayColorFor(s) }" />
                    <span style="font-size:14px; font-weight:700; color:var(--text-1);">{{ s.dayLabel }}</span>
                    <el-tag v-if="s.isCustom" size="small" type="info" effect="plain">Custom</el-tag>
                  </div>
                  <div v-if="s.notes" style="font-size:12px; color:var(--text-3); margin-top:3px; font-style:italic; padding-left:18px;">
                    "{{ s.notes.slice(0, 60) }}{{ s.notes.length > 60 ? '…' : '' }}"
                  </div>
                </td>
                <td style="text-align:center;">
                  <el-tag v-if="s.dayNumber" size="small" effect="plain" :style="{ color: dayColorFor(s), borderColor: dayColorFor(s), background: dayColorFor(s) + '18' }">
                    Day {{ s.dayNumber }}
                  </el-tag>
                  <span v-else style="color:var(--text-3); font-size:13px;">—</span>
                </td>
                <td style="text-align:center; font-size:14px; font-weight:600; color:var(--text-2);">
                  {{ s.exercises.length }}
                </td>
                <td style="text-align:center; font-size:14px; font-weight:600; color:var(--text-2);">
                  {{ totalSetsOf(s) }}
                </td>
                <td style="text-align:center;">
                  <span v-if="anyCardioOf(s)" style="color:var(--success); font-size:18px;" title="Cardio logged">✓</span>
                  <span v-else style="color:var(--border); font-size:18px;">—</span>
                </td>
                <td>
                  <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                    <el-button size="small" :icon="Edit" plain style="border-radius:7px;" @click.stop="$emit('edit', s)" />
                    <el-popconfirm title="Delete this session?" width="200" @confirm="$emit('delete', s.id)">
                      <template #reference>
                        <el-button size="small" type="danger" plain :icon="Delete" style="border-radius:7px;" @click.stop />
                      </template>
                    </el-popconfirm>
                    <el-button size="small" plain style="border-radius:7px; padding:0 8px; font-size:11px; font-weight:700;" @click.stop="toggleExpand(s.id)">
                      {{ expanded.has(s.id) ? '▲' : '▼' }}
                    </el-button>
                  </div>
                </td>
              </tr>

              <!-- Expanded detail row -->
              <tr v-if="expanded.has(s.id)" class="detail-tr">
                <td colspan="7">
                  <div class="detail-panel">
                    <!-- Exercise chips grid -->
                    <div class="detail-exercises">
                      <div v-for="ex in s.exercises" :key="ex.id" class="detail-ex-card"
                        :style="matchedExercise && ex.name.toLowerCase().includes(matchedExercise) ? { border: '1.5px solid var(--primary)', background: 'var(--primary-light)' } : {}">
                        <div class="detail-ex-header">
                          <span style="font-size:13px; font-weight:700; color:var(--text-1);">{{ ex.name }}</span>
                          <el-tag :type="ex.type==='Compound'?'warning':'info'" size="small" effect="plain">{{ ex.type }}</el-tag>
                        </div>
                        <div class="detail-sets-row">
                          <div
                            v-for="(set, i) in ex.sets"
                            :key="i"
                            :class="['set-chip', { done: set.reps && set.reps !== '0' }]"
                          >
                            <span class="set-chip-num">{{ i+1 }}</span>
                            {{ set.reps || '–' }} reps
                            <span v-if="set.weight" style="opacity:0.75;">@ {{ set.weight }}kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Cardio + notes row -->
                    <div v-if="anyCardioOf(s) || s.notes" class="detail-meta">
                      <div v-if="anyCardioOf(s)" class="cardio-summary">
                        <span v-if="s.cardio?.treadmill?.done">🏃 Treadmill {{ s.cardio.treadmill.duration }}min</span>
                        <span v-if="s.cardio?.jogging?.done">🏅 Jogging {{ s.cardio.jogging.duration }}min</span>
                        <span v-if="s.cardio?.cycling?.done">🚴 Cycling {{ s.cardio.cycling.duration }}min</span>
                      </div>
                      <div v-if="s.notes" class="notes-summary">
                        📝 "{{ s.notes }}"
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Edit, Delete, Download, Search } from '@element-plus/icons-vue';
import { exportToExcel } from '../composables/useExport.js';

const props = defineProps({ sessions: Array, plan: Object, bodyWeights: Array });
const emit  = defineEmits(['edit', 'delete']);

// Export
const exportDialogOpen = ref(false);
const exportFrom       = ref('');
const exportTo         = ref('');

const exportCount = computed(() => props.sessions.filter(s => {
  if (exportFrom.value && s.date < exportFrom.value) return false;
  if (exportTo.value   && s.date > exportTo.value)   return false;
  return true;
}).length);

const exportSets = computed(() => props.sessions.filter(s => {
  if (exportFrom.value && s.date < exportFrom.value) return false;
  if (exportTo.value   && s.date > exportTo.value)   return false;
  return true;
}).reduce((a, s) => a + s.exercises.reduce((b, ex) => b + ex.sets.length, 0), 0));

function doExport() {
  exportToExcel({
    sessions:     props.sessions,
    bodyWeights:  props.bodyWeights || [],
    dateFrom:     exportFrom.value || null,
    dateTo:       exportTo.value   || null,
  });
  exportDialogOpen.value = false;
  ElMessage.success('Excel file downloaded!');
}

const filterDay      = ref(null);
const searchExercise = ref('');
const expanded       = ref(new Set());

const filteredSessions = computed(() => {
  let all = [...props.sessions].sort((a, b) => b.date.localeCompare(a.date));

  // Filter by day
  if (filterDay.value) {
    if (filterDay.value === 'custom') all = all.filter(s => s.isCustom);
    else all = all.filter(s => s.dayNumber === filterDay.value);
  }

  // Filter by exercise name search
  if (searchExercise.value.trim()) {
    const q = searchExercise.value.toLowerCase().trim();
    all = all.filter(s =>
      s.exercises.some(ex => ex.name.toLowerCase().includes(q))
    );
  }

  return all;
});

// Which exercises matched the search (for highlighting)
const matchedExercise = computed(() => searchExercise.value.toLowerCase().trim());

const groupedSessions = computed(() => {
  const g = {};
  filteredSessions.value.forEach(s => {
    const [y,m] = s.date.split('-');
    const key = `${MONTHS[Number(m)-1]} ${y}`;
    if (!g[key]) g[key] = [];
    g[key].push(s);
  });
  return g;
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const totalSetsAll   = computed(() => props.sessions.reduce((a,s) => a + totalSetsOf(s), 0));
const uniqueDays     = computed(() => new Set(props.sessions.map(s => s.date)).size);
const cardioSessions = computed(() => props.sessions.filter(s => anyCardioOf(s)).length);
const thisWeekCount  = computed(() => {
  const now = new Date();
  const weekAgo = new Date(now - 7*24*60*60*1000).toISOString().slice(0,10);
  return props.sessions.filter(s => s.date >= weekAgo).length;
});

function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1]} ${y}`;
}

function dayColorFor(s) { return (s.dayNumber && props.plan[s.dayNumber]) ? props.plan[s.dayNumber].color : '#fd79a8'; }
function totalSetsOf(s) { return s.exercises.reduce((a,ex) => a + ex.sets.length, 0); }
function anyCardioOf(s) { return Object.values(s.cardio ?? {}).some(c => c.done); }
function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}
</script>

<style scoped>
/* Stats bar */
.stats-bar {
  display: flex;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 28px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  gap: 0;
}

.stat-card { flex: 1; text-align: center; }
.stat-card-val { font-size: 26px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; }
.stat-card-key { font-size: 12px; color: var(--text-3); font-weight: 500; margin-top: 3px; }
.stat-divider  { width: 1px; height: 40px; background: var(--border); flex-shrink: 0; margin: 0 4px; }

/* Table */
.history-table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.history-table { width: 100%; border-collapse: collapse; }

.history-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.month-row td {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: #f9fafd;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.session-tr { cursor: pointer; transition: background 0.1s; }
.session-tr td { padding: 13px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.session-tr:hover td { background: #fafbff; }
.session-tr.expanded td { background: #f5f7ff; }

.color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Detail panel */
.detail-tr td { padding: 0; }

.detail-panel {
  padding: 16px 20px;
  background: #f8f9fe;
  border-bottom: 1px solid var(--border);
}

.detail-exercises {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.detail-ex-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.detail-ex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-sets-row { display: flex; flex-wrap: wrap; gap: 5px; }

.set-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  color: var(--text-2);
  background: var(--surface);
}

.set-chip.done { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }

.set-chip-num {
  width: 16px; height: 16px;
  background: var(--border);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: var(--text-2);
  flex-shrink: 0;
}

.set-chip.done .set-chip-num { background: #6ee7b7; color: #065f46; }

.detail-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.cardio-summary {
  display: flex;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 7px 14px;
  flex-wrap: wrap;
}

.notes-summary {
  font-size: 13px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 7px 14px;
  font-style: italic;
  flex: 1;
}
</style>
