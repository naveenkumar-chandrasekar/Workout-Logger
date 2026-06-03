<template>
  <div class="fade-up">

    <!-- ── Greeting bar ── -->
    <div class="greeting-bar">
      <div>
        <div class="greeting-text">{{ greeting }}, Naveen 👋</div>
        <div class="greeting-date">{{ fullDate }}</div>
      </div>
      <el-button
        type="primary"
        style="font-weight:700; border-radius:10px; height:40px;"
        @click="$emit('go-log')"
      >
        <el-icon style="margin-right:6px;"><Plus /></el-icon>
        Log Today's Workout
      </el-button>
    </div>

    <!-- ── Top stat cards ── -->
    <div class="stat-row">
      <div class="stat-card" :class="{ 'streak-active': streak > 0 }">
        <div class="stat-icon" style="background:#fff3e0;">🔥</div>
        <div class="stat-body">
          <div class="stat-val">{{ streak }}</div>
          <div class="stat-key">Day streak</div>
        </div>
        <div v-if="streak > 0" class="streak-badge">Active</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:#e8f5e9;">💪</div>
        <div class="stat-body">
          <div class="stat-val">{{ thisWeekSessions }}</div>
          <div class="stat-key">Sessions this week</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:#e3f2fd;">📊</div>
        <div class="stat-body">
          <div class="stat-val">{{ thisWeekSets }}</div>
          <div class="stat-key">Sets this week</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:#f3e5f5;">🏆</div>
        <div class="stat-body">
          <div class="stat-val">{{ longestStreak }}</div>
          <div class="stat-key">Longest streak</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:#fce4ec;">📅</div>
        <div class="stat-body">
          <div class="stat-val">{{ sessions.length }}</div>
          <div class="stat-key">Total sessions</div>
        </div>
      </div>
    </div>

    <!-- ── Row 1: Today + This week (side by side) ── -->
    <div class="dashboard-grid" style="margin-bottom:16px;">

      <!-- Today's workout -->
      <div class="dash-card today-card" :style="{ borderLeftColor: todayPlan?.color || '#6c5ce7' }">
        <div class="dash-card-header">
          <div>
            <span class="dash-card-title">Today's workout</span>
            <div v-if="alreadyLoggedToday" style="margin-top:2px;">
              <el-tag type="success" size="small" effect="light">✓ Logged today</el-tag>
            </div>
          </div>
          <el-button v-if="todayPlan" type="primary" size="small" style="border-radius:8px; font-weight:700;" @click="$emit('start-day', suggestedDayNum)">
            Start →
          </el-button>
        </div>
        <div v-if="todayPlan">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
            <div class="today-pill" :style="{ background: todayPlan.color }">Day {{ suggestedDayNum }}</div>
            <div>
              <div style="font-size:15px; font-weight:800; color:var(--text-1);">{{ todayPlan.label }}</div>
              <div style="font-size:12px; color:var(--text-3); margin-top:2px;">{{ todayPlan.muscles.join(' · ') }}</div>
            </div>
          </div>
          <div class="today-exercises">
            <div v-for="ex in todayPlan.exercises" :key="ex.name" class="today-ex-row">
              <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                <span class="today-muscle-dot" :style="{ background: muscleStyle(ex.muscle).color }" />
                <span style="font-size:13px; font-weight:600; color:var(--text-1);">{{ ex.name }}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                <span style="font-size:12px; color:var(--text-3);">{{ ex.sets }}×{{ ex.repsTarget }}</span>
                <span class="muscle-tag" :style="{ background: muscleStyle(ex.muscle).bg, color: muscleStyle(ex.muscle).color, borderColor: muscleStyle(ex.muscle).border }">{{ ex.muscle || '—' }}</span>
              </div>
            </div>
          </div>
          <div v-if="todayPlan.coachTip" class="today-tip">💡 {{ todayPlan.coachTip }}</div>
        </div>
        <div v-else class="empty-state" style="padding:32px 0;">
          <div class="empty-icon" style="font-size:36px;">🎉</div>
          <div class="empty-title" style="font-size:15px;">Rest day</div>
          <div class="empty-desc">You've completed all 6 days! Take a full rest today.</div>
        </div>
      </div>

      <!-- This week + heatmap stacked -->
      <div class="dash-col">
        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">This week</span>
            <span class="dash-card-sub">{{ weekRange }}</span>
          </div>
          <div class="week-grid">
            <div v-for="d in weekDays" :key="d.iso" :class="['week-day', { today: d.isToday, 'has-session': d.sessions.length > 0, future: d.isFuture }]">
              <div class="week-day-name">{{ d.name }}</div>
              <div class="week-day-num">{{ d.dayNum }}</div>
              <div class="week-day-dots">
                <div v-for="s in d.sessions.slice(0,3)" :key="s.id" class="week-dot" :style="{ background: dayColorFor(s) }" :title="s.dayLabel" />
                <div v-if="!d.sessions.length && !d.isFuture" class="week-rest">–</div>
              </div>
            </div>
          </div>
          <div style="margin-top:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:12px; font-weight:600; color:var(--text-2);">Weekly goal</span>
              <span style="font-size:12px; font-weight:700; color:var(--primary);">{{ thisWeekSessions }}/6 days</span>
            </div>
            <div style="background:var(--border); border-radius:99px; height:6px; overflow:hidden;">
              <div style="height:100%; border-radius:99px; background:linear-gradient(90deg,#6c5ce7,#a29bfe); transition:width 0.4s;" :style="{ width: Math.min(100,(thisWeekSessions/6)*100) + '%' }" />
            </div>
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card-header">
            <span class="dash-card-title">Last 30 days</span>
            <span class="dash-card-sub">{{ last30Trained }} days trained</span>
          </div>
          <div class="heatmap">
            <div v-for="d in last30Days" :key="d.iso" :class="['heat-cell', { active: d.count > 0, today: d.isToday }]" :style="d.count > 0 ? { background: heatColor(d.count), opacity: 0.85 + d.count * 0.1 } : {}" :title="`${d.label}: ${d.count} session${d.count !== 1 ? 's' : ''}`" />
          </div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:10px;">
            <span style="font-size:11px; color:var(--text-3);">Less</span>
            <div v-for="i in 4" :key="i" class="heat-legend" :style="{ background: heatColor(i-1), opacity: i === 1 ? 0.15 : 0.7 + i*0.07 }" />
            <span style="font-size:11px; color:var(--text-3);">More</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Row 2: Muscle groups + Plan completion + Recent sessions ── -->
    <div class="dashboard-grid-3" style="margin-bottom:16px;">

      <!-- Muscle groups -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-card-title">Muscle groups this week</span>
        </div>
        <div v-if="!muscleFreq.length" style="padding:16px; text-align:center; font-size:13px; color:var(--text-3);">
          Log workouts to see muscle frequency.
        </div>
        <div v-for="m in muscleFreq" :key="m.name" class="muscle-freq-row">
          <div style="display:flex; align-items:center; gap:8px; width:90px; flex-shrink:0;">
            <div class="mf-dot" :style="{ background: muscleStyle(m.name).color }" />
            <span style="font-size:12px; font-weight:600; color:var(--text-2);">{{ m.name }}</span>
          </div>
          <div style="flex:1; background:var(--border); border-radius:99px; height:6px; overflow:hidden;">
            <div style="height:100%; border-radius:99px; transition:width 0.4s;" :style="{ width: (m.count / maxMuscleCount * 100) + '%', background: muscleStyle(m.name).color }" />
          </div>
          <span style="font-size:12px; font-weight:700; color:var(--text-2); width:20px; text-align:right;">{{ m.count }}</span>
        </div>
      </div>

      <!-- Plan completion -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-card-title">Plan completion</span>
          <span class="dash-card-sub">Overall</span>
        </div>
        <div class="plan-completion-grid">
          <div v-for="n in 6" :key="n" class="pc-cell" :class="{ done: dayLoggedCount(n) > 0 }" :style="dayLoggedCount(n) > 0 ? { borderColor: plan[n].color, background: plan[n].color + '18' } : {}">
            <div class="pc-pill" :style="{ background: plan[n].color }">Day {{ n }}</div>
            <div class="pc-label">{{ plan[n].label.split('·')[0].trim() }}</div>
            <div class="pc-count">{{ dayLoggedCount(n) }}×</div>
          </div>
        </div>
      </div>

      <!-- Recent sessions -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-card-title">Recent sessions</span>
          <el-button size="small" text style="color:var(--primary); font-weight:600;" @click="$emit('go-history')">View all →</el-button>
        </div>
        <div v-if="!recentSessions.length" style="padding:20px; text-align:center; color:var(--text-3); font-size:13px;">No sessions yet.</div>
        <div v-for="s in recentSessions" :key="s.id" class="recent-row" @click="$emit('edit-session', s)">
          <div class="recent-dot" :style="{ background: dayColorFor(s) }" />
          <div style="flex:1; min-width:0;">
            <div style="font-size:13px; font-weight:700; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ s.dayLabel }}</div>
            <div style="font-size:11px; color:var(--text-3); margin-top:1px;">{{ formatDate(s.date) }} · {{ s.exercises.length }} ex · {{ totalSetsOf(s) }} sets</div>
          </div>
          <el-tag v-if="s.dayNumber" size="small" effect="plain" :style="{ color: dayColorFor(s), borderColor: dayColorFor(s), background: dayColorFor(s)+'18' }">Day {{ s.dayNumber }}</el-tag>
        </div>
      </div>
    </div>

    <!-- ── Milestone badges (full width) ── -->
    <div v-if="earnedBadges.length" style="margin-bottom:8px;">
      <div class="section-title">Achievements</div>
      <div class="badges-grid">
        <div
          v-for="b in earnedBadges"
          :key="b.id"
          class="badge-card"
          :class="{ 'badge-new': b.isNew }"
          :title="b.desc"
        >
          <div class="badge-icon">{{ b.icon }}</div>
          <div class="badge-name">{{ b.name }}</div>
          <div class="badge-desc">{{ b.desc }}</div>
          <div v-if="b.isNew" class="badge-new-tag">New!</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { muscleStyle } from '../data/workoutPlan.js';

const props = defineProps({
  plan: Object,
  sessions: Array,
});

const emit = defineEmits(['go-log', 'go-history', 'start-day', 'edit-session']);

// ── Date helpers ───────────────────────────────────────────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isoDate(d) { return d.toISOString().slice(0, 10); }

function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m)-1]} ${y}`;
}

// ── Greeting ───────────────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const fullDate = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

// ── Session lookups ────────────────────────────────────────────────────────
const sessionsByDate = computed(() => {
  const map = {};
  props.sessions.forEach(s => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  });
  return map;
});

function dayColorFor(s) {
  if (s.dayNumber && props.plan[s.dayNumber]) return props.plan[s.dayNumber].color;
  return '#fd79a8';
}

function totalSetsOf(s) { return s.exercises.reduce((a, ex) => a + ex.sets.length, 0); }

// ── Streak ─────────────────────────────────────────────────────────────────
const streak = computed(() => {
  const today     = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86400000));
  const dates     = [...new Set(props.sessions.map(s => s.date))].sort().reverse();
  if (!dates.length) return 0;
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let count   = 1;
  let current = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const expected = isoDate(new Date(new Date(current).getTime() - 86400000));
    if (dates[i] === expected) { count++; current = expected; }
    else break;
  }
  return count;
});

const longestStreak = computed(() => {
  const dates = [...new Set(props.sessions.map(s => s.date))].sort();
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = isoDate(new Date(new Date(dates[i]).getTime() - 86400000));
    if (dates[i-1] === prev) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
});

// ── This week ──────────────────────────────────────────────────────────────
const weekDays = computed(() => {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7)); // shift to Mon

  return Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = isoDate(d);
    return {
      iso,
      name:     DAYS[d.getDay()],
      dayNum:   d.getDate(),
      isToday:  iso === isoDate(today),
      isFuture: d > today,
      sessions: sessionsByDate.value[iso] || [],
    };
  });
});

const weekRange = computed(() => {
  if (!weekDays.value.length) return '';
  const first = weekDays.value[0];
  const last  = weekDays.value[6];
  return `${first.dayNum} – ${last.dayNum} ${MONTHS[new Date(last.iso).getMonth()]}`;
});

const thisWeekSessions = computed(() => weekDays.value.reduce((a, d) => a + (d.sessions.length > 0 ? 1 : 0), 0));
const thisWeekSets     = computed(() => {
  const isos = weekDays.value.map(d => d.iso);
  return props.sessions
    .filter(s => isos.includes(s.date))
    .reduce((a, s) => a + totalSetsOf(s), 0);
});

// ── Last 30 days heatmap ───────────────────────────────────────────────────
const last30Days = computed(() => {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d    = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const iso  = isoDate(d);
    const count = (sessionsByDate.value[iso] || []).length;
    return { iso, count, isToday: iso === isoDate(today), label: formatDate(iso) };
  });
});

const last30Trained = computed(() => last30Days.value.filter(d => d.count > 0).length);

function heatColor(count) {
  const colors = ['#e8eaf0', '#c5b8fb', '#9b8df7', '#6c5ce7'];
  return colors[Math.min(count, 3)];
}

// ── Suggested day ──────────────────────────────────────────────────────────
const suggestedDayNum = computed(() => {
  const todayIso = isoDate(new Date());
  const todaySession = props.sessions.find(s => s.date === todayIso);
  if (todaySession?.dayNumber) return todaySession.dayNumber;

  // find last logged day number and suggest next
  const withDay = [...props.sessions]
    .filter(s => s.dayNumber)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!withDay.length) return 1;
  const lastDay = withDay[0].dayNumber;
  return lastDay >= 6 ? 1 : lastDay + 1;
});

const todayPlan      = computed(() => props.plan[suggestedDayNum.value] || null);
const alreadyLoggedToday = computed(() => {
  const today = isoDate(new Date());
  return props.sessions.some(s => s.date === today);
});

// ── Recent sessions ────────────────────────────────────────────────────────
const recentSessions = computed(() =>
  [...props.sessions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)
);

// ── Muscle frequency this week ─────────────────────────────────────────────
const muscleFreq = computed(() => {
  const isos = weekDays.value.map(d => d.iso);
  const freq = {};
  props.sessions
    .filter(s => isos.includes(s.date))
    .forEach(s => {
      s.exercises.forEach(ex => {
        const m = ex.muscle || ex.type || 'Other';
        freq[m] = (freq[m] || 0) + 1;
      });
    });
  return Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
});

const maxMuscleCount = computed(() => Math.max(...muscleFreq.value.map(m => m.count), 1));

// ── Plan completion counts ─────────────────────────────────────────────────
function dayLoggedCount(n) {
  return props.sessions.filter(s => s.dayNumber === n).length;
}

// ── Milestone badges ───────────────────────────────────────────────────────
const MILESTONES = [
  { id: 'first_session',   icon: '🏋️', name: 'First Step',       desc: 'Logged your first workout',          check: (s) => s.length >= 1 },
  { id: 'sessions_5',      icon: '🔥', name: 'On a Roll',         desc: '5 sessions logged',                  check: (s) => s.length >= 5 },
  { id: 'sessions_10',     icon: '💪', name: '10 Sessions',        desc: '10 sessions logged',                 check: (s) => s.length >= 10 },
  { id: 'sessions_25',     icon: '⚡', name: '25 Sessions',        desc: '25 sessions logged',                 check: (s) => s.length >= 25 },
  { id: 'sessions_50',     icon: '🚀', name: '50 Sessions',        desc: '50 sessions logged',                 check: (s) => s.length >= 50 },
  { id: 'sessions_100',    icon: '💯', name: 'Century Club',       desc: '100 sessions logged',                check: (s) => s.length >= 100 },
  { id: 'streak_3',        icon: '📅', name: '3-Day Streak',       desc: '3 consecutive training days',        check: (s, st) => st >= 3 },
  { id: 'streak_7',        icon: '🗓️', name: 'Week Warrior',       desc: '7-day training streak',              check: (s, st) => st >= 7 },
  { id: 'streak_14',       icon: '🏅', name: '2-Week Streak',      desc: '14-day training streak',             check: (s, st) => st >= 14 },
  { id: 'full_week',       icon: '⭐', name: 'Full Week',           desc: 'All 6 days trained in one week',     check: (s) => hasFullWeek(s) },
  { id: 'first_pr',        icon: '🏆', name: 'First PR',           desc: 'Beat a personal record',             check: (s) => hasPR(s) },
  { id: 'all_days',        icon: '🎯', name: 'All Days Done',       desc: 'Logged all 6 workout days at least once', check: (s) => allDaysLogged(s) },
  { id: 'cardio_10',       icon: '🏃', name: 'Cardio Lover',        desc: '10 sessions with cardio logged',     check: (s) => s.filter(x => Object.values(x.cardio ?? {}).some(c => c.done)).length >= 10 },
];

function hasFullWeek(sessions) {
  const weekMap = {};
  sessions.forEach(s => {
    const d = new Date(s.date);
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day - 1));
    const key = mon.toISOString().slice(0, 10);
    if (!weekMap[key]) weekMap[key] = new Set();
    if (s.dayNumber) weekMap[key].add(s.dayNumber);
  });
  return Object.values(weekMap).some(days => days.size >= 6);
}

function hasPR(sessions) {
  const bests = {};
  for (const s of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        if (!r) continue;
        const key = ex.name;
        if (bests[key] && w > bests[key]) return true;
        if (!bests[key] && w > 0) bests[key] = w;
        else if (bests[key]) bests[key] = Math.max(bests[key], w);
      }
    }
  }
  return false;
}

function allDaysLogged(sessions) {
  const days = new Set(sessions.map(s => s.dayNumber).filter(Boolean));
  return days.size >= 6;
}

const earnedBadges = computed(() => {
  const s  = props.sessions;
  const st = streak.value;
  const prev = JSON.parse(localStorage.getItem('wl_badges') || '[]');
  const earned = MILESTONES.filter(m => m.check(s, st));
  // mark newly earned badges
  const result = earned.map(m => ({ ...m, isNew: !prev.includes(m.id) }));
  // persist
  localStorage.setItem('wl_badges', JSON.stringify(earned.map(m => m.id)));
  return result;
});
</script>

<style scoped>
/* Greeting */
.greeting-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}
.greeting-text { font-size: 22px; font-weight: 800; color: var(--text-1); letter-spacing: -0.4px; }
.greeting-date { font-size: 13px; color: var(--text-3); margin-top: 3px; }

/* Stat row */
.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.stat-card.streak-active { border-color: #fbbf24; background: #fffbeb; }

.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.stat-val  { font-size: 26px; font-weight: 800; color: var(--text-1); letter-spacing: -0.5px; line-height: 1; }
.stat-key  { font-size: 11px; color: var(--text-3); font-weight: 600; margin-top: 3px; }

.streak-badge {
  position: absolute;
  top: 10px; right: 10px;
  font-size: 10px; font-weight: 700;
  background: #fbbf24; color: #78350f;
  border-radius: 20px; padding: 2px 8px;
}

/* Dashboard grids */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 16px;
  align-items: start;
}

.dashboard-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

.dash-col { display: flex; flex-direction: column; gap: 16px; }

@media (max-width: 1100px) {
  .dashboard-grid-3 { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .dashboard-grid,
  .dashboard-grid-3 { grid-template-columns: 1fr !important; }
}

/* Dash card */
.dash-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.dash-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.dash-card-title { font-size: 14px; font-weight: 700; color: var(--text-1); }
.dash-card-sub   { font-size: 12px; color: var(--text-3); }

/* Week grid */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  padding: 16px;
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 10px;
  transition: background 0.1s;
}

.week-day.today { background: var(--primary-light); }
.week-day.future { opacity: 0.4; }

.week-day-name { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
.week-day.today .week-day-name { color: var(--primary); }

.week-day-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: var(--text-2);
}

.week-day.today .week-day-num { background: var(--primary); color: #fff; }
.week-day.has-session .week-day-num { color: var(--text-1); }

.week-day-dots { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; min-height: 10px; margin-top: 2px; }

.week-dot { width: 8px; height: 8px; border-radius: 50%; }
.week-rest { font-size: 10px; color: var(--border); }

/* Heatmap */
.heatmap {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 4px;
  padding: 16px;
}

.heat-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: transform 0.1s;
  cursor: default;
}

.heat-cell.active { border-color: transparent; }
.heat-cell.today  { ring: 2px solid var(--primary); outline: 2px solid var(--primary); outline-offset: 1px; }

.heat-legend { width: 14px; height: 14px; border-radius: 3px; }

/* Recent sessions */
.recent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 18px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}
.recent-row:last-child { border-bottom: none; }
.recent-row:hover { background: #fafbff; }
.recent-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Today card */
.today-card { border-left: 4px solid var(--primary); }

.today-pill {
  font-size: 10px; font-weight: 800; color: #fff;
  border-radius: 20px; padding: 3px 12px;
  text-transform: uppercase; letter-spacing: 0.4px;
  flex-shrink: 0;
}

.today-exercises { margin: 0 -18px; }

.today-ex-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 18px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  transition: background 0.1s;
}
.today-ex-row:last-child { border-bottom: none; }
.today-ex-row:hover { background: #fafbff; }

.today-muscle-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.today-tip {
  margin: 10px 18px 14px;
  font-size: 12px; color: #92400e; line-height: 1.5;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 8px; padding: 8px 12px;
}

.muscle-tag {
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px; border: 1px solid;
  white-space: nowrap;
}

/* Muscle frequency */
.muscle-freq-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--border);
}
.muscle-freq-row:last-child { border-bottom: none; }
.mf-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Plan completion */
.plan-completion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}

.pc-cell {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  transition: all 0.15s;
}

.pc-pill {
  font-size: 10px; font-weight: 800; color: #fff;
  border-radius: 20px; padding: 2px 8px;
  display: inline-block; text-transform: uppercase;
  letter-spacing: 0.4px; margin-bottom: 5px;
}

.pc-label { font-size: 11px; font-weight: 600; color: var(--text-2); line-height: 1.3; }
.pc-count { font-size: 18px; font-weight: 800; color: var(--text-1); margin-top: 4px; }

/* Today's card body padding */
.dash-card > div:not(.dash-card-header) { padding: 16px 18px; }
.today-exercises { padding: 0 !important; margin: 0; }

/* ── Badges ── */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.badge-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 12px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
}

.badge-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.badge-card.badge-new {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fff);
}

.badge-icon { font-size: 32px; margin-bottom: 6px; line-height: 1; }
.badge-name { font-size: 12px; font-weight: 700; color: var(--text-1); margin-bottom: 3px; }
.badge-desc { font-size: 11px; color: var(--text-3); line-height: 1.4; }

.badge-new-tag {
  position: absolute;
  top: -6px; right: -6px;
  background: #f59e0b;
  color: #78350f;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}
</style>
