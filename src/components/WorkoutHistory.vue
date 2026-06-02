<template>
  <div class="fade-up">
    <!-- Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;">
      <div>
        <div class="page-title">History</div>
        <div class="page-subtitle">{{ sessions.length }} sessions logged</div>
      </div>
      <el-select v-model="filterDay" placeholder="All days" clearable size="small" style="width:120px;">
        <el-option v-for="n in 6" :key="n" :label="`Day ${n}`" :value="n" />
        <el-option label="Custom" value="custom" />
      </el-select>
    </div>

    <!-- Summary chips -->
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;">
      <div class="stat-chip">
        <span class="dot" style="background:#6c5ce7;"></span>
        {{ sessions.length }} sessions
      </div>
      <div class="stat-chip">
        <span class="dot" style="background:#10b981;"></span>
        {{ totalSetsAll }} total sets
      </div>
      <div class="stat-chip">
        <span class="dot" style="background:#f59e0b;"></span>
        {{ uniqueDays }} days trained
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredSessions.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No sessions yet</div>
      <div class="empty-desc">Head to the Log tab to record your first workout.</div>
    </div>

    <!-- Sessions grouped by month -->
    <template v-for="(group, month) in groupedSessions" :key="month">
      <div class="history-month-label">{{ month }}</div>

      <div v-for="s in group" :key="s.id" class="history-session">
        <!-- Header row -->
        <div class="history-session-header">
          <div
            class="history-color-bar"
            :style="{ background: dayColorFor(s) }"
          />
          <div class="history-info">
            <div class="history-day-label">{{ s.dayLabel }}</div>
            <div class="history-meta">
              <span>{{ formatDate(s.date) }}</span>
              <span class="dot"></span>
              <span>{{ s.exercises.length }} exercises</span>
              <span class="dot"></span>
              <span>{{ totalSetsOf(s) }} sets</span>
              <template v-if="anyCardioOf(s)">
                <span class="dot"></span>
                <span>🏃 cardio</span>
              </template>
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <el-button
              size="small"
              style="border-radius:8px; font-weight:600;"
              @click="$emit('edit', s)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-popconfirm title="Delete this session?" @confirm="$emit('delete', s.id)" width="200">
              <template #reference>
                <el-button size="small" type="danger" plain style="border-radius:8px;">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>

        <!-- Expandable detail -->
        <el-collapse-transition>
          <div v-if="expanded.has(s.id)" class="history-detail">
            <div v-for="ex in s.exercises" :key="ex.id" class="history-ex-row">
              <div class="history-ex-name">
                {{ ex.name }}
                <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">
                  {{ ex.type }}
                </el-tag>
              </div>
              <div class="history-sets-grid">
                <div
                  v-for="(set, i) in ex.sets"
                  :key="i"
                  :class="['history-set-chip', { done: set.reps && set.reps !== '0' }]"
                >
                  Set {{ i + 1 }}: {{ set.reps || '–' }}
                  <span v-if="set.weight">@ {{ set.weight }}kg</span>
                </div>
              </div>
            </div>

            <!-- Cardio -->
            <div
              v-if="anyCardioOf(s)"
              style="padding:10px 16px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border-top:1px solid #d1fae5; display:flex; gap:14px; flex-wrap:wrap;"
            >
              <span v-if="s.cardio?.treadmill?.done" style="font-size:12px; font-weight:600; color:#065f46;">
                🏃 Treadmill {{ s.cardio.treadmill.duration }} min
              </span>
              <span v-if="s.cardio?.jogging?.done" style="font-size:12px; font-weight:600; color:#065f46;">
                🏅 Jogging {{ s.cardio.jogging.duration }} min
              </span>
              <span v-if="s.cardio?.cycling?.done" style="font-size:12px; font-weight:600; color:#065f46;">
                🚴 Cycling {{ s.cardio.cycling.duration }} min
              </span>
            </div>

            <!-- Notes -->
            <div
              v-if="s.notes"
              style="padding:10px 16px; background:#fffbeb; border-top:1px solid #fde68a; font-size:12px; color:#92400e; font-style:italic; line-height:1.5;"
            >
              "{{ s.notes }}"
            </div>
          </div>
        </el-collapse-transition>

        <!-- Expand toggle -->
        <div class="history-expand-toggle" @click="toggleExpand(s.id)">
          <span>{{ expanded.has(s.id) ? '▲ Hide details' : '▼ Show details' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Edit, Delete } from '@element-plus/icons-vue';

const props = defineProps({ sessions: Array, plan: Object });
const emit  = defineEmits(['edit', 'delete']);

const filterDay = ref(null);
const expanded  = ref(new Set());

const filteredSessions = computed(() => {
  const all = [...props.sessions].sort((a, b) => b.date.localeCompare(a.date));
  if (!filterDay.value) return all;
  if (filterDay.value === 'custom') return all.filter((s) => s.isCustom);
  return all.filter((s) => s.dayNumber === filterDay.value);
});

const groupedSessions = computed(() => {
  const groups = {};
  filteredSessions.value.forEach((s) => {
    const [y, m] = s.date.split('-');
    const key = `${MONTHS[Number(m) - 1]} ${y}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
});

const totalSetsAll  = computed(() => props.sessions.reduce((a, s) => a + totalSetsOf(s), 0));
const uniqueDays    = computed(() => new Set(props.sessions.map((s) => s.date)).size);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
}

function dayColorFor(s) {
  if (s.dayNumber && props.plan[s.dayNumber]) return props.plan[s.dayNumber].color;
  return '#fd79a8';
}

function totalSetsOf(s)  { return s.exercises.reduce((a, ex) => a + ex.sets.length, 0); }
function anyCardioOf(s)  { return Object.values(s.cardio ?? {}).some((c) => c.done); }

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}
</script>
