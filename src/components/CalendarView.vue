<template>
  <div class="fade-up">

    <!-- Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
      <div>
        <div class="page-title">Training Calendar</div>
        <div class="page-subtitle">{{ monthSessions }} sessions in {{ monthLabel }}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <el-button :icon="ArrowLeft" circle plain @click="prevMonth" />
        <span style="font-size:16px; font-weight:700; color:var(--text-1); min-width:160px; text-align:center;">{{ monthLabel }}</span>
        <el-button :icon="ArrowRight" circle plain @click="nextMonth" />
        <el-button size="small" plain style="border-radius:8px;" @click="goToday">Today</el-button>
      </div>
    </div>

    <!-- Month stats chips -->
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
      <div class="stat-chip" v-for="d in monthDayBreakdown" :key="d.dayNum">
        <div class="stat-dot" :style="{ background: d.color }" />
        Day {{ d.dayNum }}: {{ d.count }}×
      </div>
      <div v-if="!monthSessions" style="font-size:13px; color:var(--text-3); padding:4px 0;">No sessions this month yet.</div>
    </div>

    <!-- Calendar grid -->
    <div class="cal-card">
      <!-- Day of week header -->
      <div class="cal-dow-row">
        <div v-for="d in DOW" :key="d" class="cal-dow">{{ d }}</div>
      </div>

      <!-- Weeks -->
      <div class="cal-grid">
        <div
          v-for="(cell, i) in calCells"
          :key="i"
          :class="[
            'cal-cell',
            { 'cal-today':        cell.isToday },
            { 'cal-other-month':  !cell.inMonth },
            { 'cal-has-session':  cell.sessions.length > 0 },
            { 'cal-multi':        cell.sessions.length > 1 },
          ]"
          @click="cell.sessions.length && onDayClick(cell)"
        >
          <!-- Date number -->
          <div class="cal-date-num" :class="{ 'cal-today-num': cell.isToday }">
            {{ cell.date }}
          </div>

          <!-- Session dots / badges -->
          <div v-if="cell.sessions.length" class="cal-session-badges">
            <div
              v-for="s in cell.sessions.slice(0, 3)"
              :key="s.id"
              class="cal-session-dot"
              :style="{ background: dayColor(s) }"
              :title="s.dayLabel"
            />
            <span v-if="cell.sessions.length > 3" class="cal-more">+{{ cell.sessions.length - 3 }}</span>
          </div>

          <!-- Session label (shown on larger cells) -->
          <div v-if="cell.sessions.length === 1" class="cal-session-label" :style="{ background: dayColor(cell.sessions[0]) + '22', color: dayColor(cell.sessions[0]) }">
            {{ cell.sessions[0].dayNumber ? `Day ${cell.sessions[0].dayNumber}` : 'Custom' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Session detail panel -->
    <div v-if="selectedCell" class="cal-detail-panel">
      <div class="cal-detail-header">
        <div>
          <div style="font-size:13px; color:var(--text-3);">{{ formatDate(selectedCell.iso) }}</div>
          <div style="font-size:16px; font-weight:800; color:var(--text-1); margin-top:2px;">
            {{ selectedCell.sessions.length }} session{{ selectedCell.sessions.length > 1 ? 's' : '' }}
          </div>
        </div>
        <el-button :icon="Close" circle plain size="small" @click="selectedCell = null" />
      </div>

      <div v-for="s in selectedCell.sessions" :key="s.id" class="cal-session-card">
        <div class="cal-session-card-header" :style="{ borderLeftColor: dayColor(s) }">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
              <div class="cal-day-pill" :style="{ background: dayColor(s) }">
                {{ s.dayNumber ? `Day ${s.dayNumber}` : 'Custom' }}
              </div>
              <span style="font-size:14px; font-weight:700; color:var(--text-1);">{{ s.dayLabel }}</span>
            </div>
            <div style="font-size:12px; color:var(--text-3);">
              {{ s.exercises.length }} exercises · {{ totalSets(s) }} sets
              <span v-if="anyCardio(s)"> · cardio ✓</span>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <el-button size="small" :icon="Edit" plain style="border-radius:8px;" @click="$emit('edit-session', s)">Edit</el-button>
          </div>
        </div>

        <!-- Exercise summary -->
        <div class="cal-ex-list">
          <div v-for="ex in s.exercises" :key="ex.id" class="cal-ex-row">
            <span
              class="muscle-tag"
              v-if="ex.muscle"
              :style="{ background: muscleStyle(ex.muscle).bg, color: muscleStyle(ex.muscle).color, borderColor: muscleStyle(ex.muscle).border }"
            >{{ ex.muscle }}</span>
            <span style="font-size:13px; color:var(--text-1); font-weight:500;">{{ ex.name }}</span>
            <span style="font-size:12px; color:var(--text-3); margin-left:auto;">{{ ex.sets.length }} sets</span>
          </div>
        </div>

        <!-- Cardio -->
        <div v-if="anyCardio(s)" style="padding:8px 14px; background:#ecfdf5; font-size:12px; font-weight:600; color:#065f46; display:flex; gap:12px; flex-wrap:wrap;">
          <span v-if="s.cardio?.treadmill?.done">🏃 {{ s.cardio.treadmill.duration }}min treadmill</span>
          <span v-if="s.cardio?.jogging?.done">🏅 {{ s.cardio.jogging.duration }}min jogging</span>
          <span v-if="s.cardio?.cycling?.done">🚴 {{ s.cardio.cycling.duration }}min cycling</span>
        </div>

        <!-- Notes -->
        <div v-if="s.notes" style="padding:8px 14px; font-size:12px; color:#92400e; background:#fffbeb; font-style:italic;">
          "{{ s.notes }}"
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ArrowLeft, ArrowRight, Close, Edit } from '@element-plus/icons-vue';
import { muscleStyle } from '../data/workoutPlan.js';

const props = defineProps({ sessions: Array, plan: Object });
const emit  = defineEmits(['edit-session']);

// ── State ──────────────────────────────────────────────────────────────────
const today      = new Date();
const curYear    = ref(today.getFullYear());
const curMonth   = ref(today.getMonth()); // 0-based
const selectedCell = ref(null);

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Navigation ─────────────────────────────────────────────────────────────
function prevMonth() {
  if (curMonth.value === 0) { curMonth.value = 11; curYear.value--; }
  else curMonth.value--;
  selectedCell.value = null;
}
function nextMonth() {
  if (curMonth.value === 11) { curMonth.value = 0; curYear.value++; }
  else curMonth.value++;
  selectedCell.value = null;
}
function goToday() {
  curYear.value  = today.getFullYear();
  curMonth.value = today.getMonth();
  selectedCell.value = null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const monthLabel = computed(() => `${MONTHS[curMonth.value]} ${curYear.value}`);

function toIso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function formatDate(iso) {
  const [y,m,d] = iso.split('-');
  return `${Number(d)} ${MONTHS_SHORT[Number(m)-1]} ${y}`;
}

function dayColor(s) {
  if (s.dayNumber && props.plan[s.dayNumber]) return props.plan[s.dayNumber].color;
  return '#fd79a8';
}

function totalSets(s)  { return s.exercises.reduce((a, ex) => a + ex.sets.length, 0); }
function anyCardio(s)  { return Object.values(s.cardio ?? {}).some(c => c.done); }

// ── Session lookup by date ─────────────────────────────────────────────────
const sessionsByDate = computed(() => {
  const map = {};
  props.sessions.forEach(s => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  });
  return map;
});

// ── Calendar cells ─────────────────────────────────────────────────────────
const calCells = computed(() => {
  const year  = curYear.value;
  const month = curMonth.value;
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  // First day of month (0=Sun, 1=Mon … 6=Sat)
  const firstDow  = new Date(year, month, 1).getDay();
  // Convert to Mon-based (0=Mon … 6=Sun)
  const startOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month overflow
  for (let i = startOffset - 1; i >= 0; i--) {
    const d   = prevDays - i;
    const m   = month - 1 < 0 ? 11 : month - 1;
    const y   = month - 1 < 0 ? year - 1 : year;
    const iso = toIso(y, m, d);
    cells.push({ date: d, iso, inMonth: false, isToday: iso === todayIso, sessions: sessionsByDate.value[iso] ?? [] });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toIso(year, month, d);
    cells.push({ date: d, iso, inMonth: true, isToday: iso === todayIso, sessions: sessionsByDate.value[iso] ?? [] });
  }

  // Next month overflow (fill to complete weeks)
  let next = 1;
  while (cells.length % 7 !== 0) {
    const m   = month + 1 > 11 ? 0  : month + 1;
    const y   = month + 1 > 11 ? year + 1 : year;
    const iso = toIso(y, m, next);
    cells.push({ date: next++, iso, inMonth: false, isToday: iso === todayIso, sessions: sessionsByDate.value[iso] ?? [] });
  }

  return cells;
});

// ── Month summary ──────────────────────────────────────────────────────────
const monthSessions = computed(() =>
  calCells.value.filter(c => c.inMonth && c.sessions.length > 0)
    .reduce((a, c) => a + c.sessions.length, 0)
);

const monthDayBreakdown = computed(() => {
  const map = {};
  calCells.value
    .filter(c => c.inMonth)
    .flatMap(c => c.sessions)
    .forEach(s => {
      if (!s.dayNumber) return;
      if (!map[s.dayNumber]) map[s.dayNumber] = { dayNum: s.dayNumber, color: dayColor(s), count: 0 };
      map[s.dayNumber].count++;
    });
  return Object.values(map).sort((a, b) => a.dayNum - b.dayNum);
});

// ── Click ──────────────────────────────────────────────────────────────────
function onDayClick(cell) {
  selectedCell.value = selectedCell.value?.iso === cell.iso ? null : cell;
}
</script>

<style scoped>
/* ── Calendar card ── */
.cal-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

/* Day-of-week header */
.cal-dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.cal-dow {
  text-align: center;
  padding: 10px 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Calendar grid */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

/* Individual cell */
.cal-cell {
  min-height: 90px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 8px 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.12s;
  position: relative;
}

.cal-cell:nth-child(7n)   { border-right: none; }
.cal-cell:nth-last-child(-n+7) { border-bottom: none; }

.cal-cell.cal-other-month { background: #fafbff; opacity: 0.5; }
.cal-cell.cal-has-session { cursor: pointer; }
.cal-cell.cal-has-session:hover { background: var(--surface); }
.cal-cell.cal-today       { background: var(--primary-light); }

/* Date number */
.cal-date-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-today-num {
  background: var(--primary);
  color: #fff;
  font-weight: 800;
}

/* Session indicators */
.cal-session-badges {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

.cal-session-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-more {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
}

.cal-session-label {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  white-space: nowrap;
  align-self: flex-start;
  margin-top: 2px;
}

/* ── Detail panel ── */
.cal-detail-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.cal-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.cal-session-card {
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.cal-session-card:last-child { border-bottom: none; }

.cal-session-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-left: 4px solid transparent;
}

.cal-day-pill {
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  border-radius: 20px;
  padding: 2px 9px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex-shrink: 0;
}

.cal-ex-list { padding: 4px 0; }

.cal-ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}

.cal-ex-row:last-child { border-bottom: none; }
.cal-ex-row:hover { background: var(--surface); }

.muscle-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Mobile: smaller cells */
@media (max-width: 768px) {
  .cal-cell { min-height: 60px; padding: 5px 4px; }
  .cal-session-label { display: none; }
  .cal-date-num { font-size: 12px; width: 22px; height: 22px; }
}
</style>
