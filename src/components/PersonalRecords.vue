<template>
  <div class="fade-up">

    <!-- Header -->
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:16px;">
      <div>
        <div class="page-title">Personal Records</div>
        <div class="page-subtitle">Auto-detected from all logged sessions · {{ Object.keys(prs).length }} exercises tracked</div>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <el-input v-model="search" placeholder="Search exercises…" clearable style="width:220px;" :prefix-icon="Search" />
        <el-select v-model="filterMuscle" placeholder="All muscles" clearable style="width:150px;">
          <el-option v-for="m in muscleOptions" :key="m" :label="m" :value="m" />
        </el-select>
        <el-select v-model="sortBy" style="width:160px;">
          <el-option label="Best weight ↓" value="weight" />
          <el-option label="Most recent PR"  value="recent" />
          <el-option label="Most sessions"   value="sessions" />
          <el-option label="A → Z"           value="alpha" />
        </el-select>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="pr-stats-bar">
      <div class="pr-stat">
        <div class="pr-stat-icon" style="background:#fff3e0;">🏆</div>
        <div>
          <div class="pr-stat-val">{{ Object.keys(prs).length }}</div>
          <div class="pr-stat-key">Exercises tracked</div>
        </div>
      </div>
      <div class="pr-divider" />
      <div class="pr-stat">
        <div class="pr-stat-icon" style="background:#e8f5e9;">📅</div>
        <div>
          <div class="pr-stat-val">{{ prsThisMonth }}</div>
          <div class="pr-stat-key">PRs set this month</div>
        </div>
      </div>
      <div class="pr-divider" />
      <div class="pr-stat">
        <div class="pr-stat-icon" style="background:#e3f2fd;">📊</div>
        <div>
          <div class="pr-stat-val">{{ totalSetsLogged }}</div>
          <div class="pr-stat-key">Total sets logged</div>
        </div>
      </div>
      <div class="pr-divider" />
      <div class="pr-stat">
        <div class="pr-stat-icon" style="background:#fce4ec;">🎯</div>
        <div>
          <div class="pr-stat-val" style="font-size:15px; letter-spacing:-0.3px;">{{ mostImproved || '—' }}</div>
          <div class="pr-stat-key">Most improved exercise</div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!sessions.length" class="empty-state" style="margin-top:60px;">
      <div class="empty-icon">🏋️</div>
      <div class="empty-title">No sessions yet</div>
      <div class="empty-desc">Log your first workout to start tracking personal records.</div>
    </div>

    <!-- No results from filter -->
    <div v-else-if="!filteredPRs.length" class="empty-state" style="margin-top:40px;">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No matches</div>
      <div class="empty-desc">Try adjusting your search or filter.</div>
    </div>

    <!-- PR cards grid -->
    <div v-else class="pr-grid">
      <div
        v-for="pr in filteredPRs"
        :key="pr.name"
        class="pr-card"
        @click="openDetail(pr)"
      >
        <!-- Card header -->
        <div class="pr-card-header">
          <div style="flex:1; min-width:0;">
            <div class="pr-ex-name">{{ pr.name }}</div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
              <span
                v-if="pr.muscle"
                class="muscle-tag"
                :style="{ background: muscleStyle(pr.muscle).bg, color: muscleStyle(pr.muscle).color, borderColor: muscleStyle(pr.muscle).border }"
              >{{ pr.muscle }}</span>
              <el-tag size="small" :type="pr.type === 'Compound' ? 'warning' : 'info'" effect="plain">{{ pr.type || '—' }}</el-tag>
            </div>
          </div>
          <div v-if="isRecentPR(pr)" class="pr-badge-new">NEW PR</div>
        </div>

        <!-- Main stats -->
        <div class="pr-card-stats">
          <div class="pr-main-stat">
            <div class="pr-main-val">{{ pr.bestWeight > 0 ? pr.bestWeight + ' kg' : '—' }}</div>
            <div class="pr-main-key">Best weight</div>
            <div class="pr-main-sub" v-if="pr.bestWeightReps">× {{ pr.bestWeightReps }} reps</div>
          </div>
          <div class="pr-stat-divider-v" />
          <div class="pr-main-stat">
            <div class="pr-main-val">{{ pr.bestReps || '—' }}</div>
            <div class="pr-main-key">Best reps</div>
            <div class="pr-main-sub" v-if="pr.bestRepsWeight">@ {{ pr.bestRepsWeight }} kg</div>
          </div>
          <div class="pr-stat-divider-v" />
          <div class="pr-main-stat">
            <div class="pr-main-val">{{ pr.totalSessions }}</div>
            <div class="pr-main-key">Sessions</div>
            <div class="pr-main-sub">{{ pr.totalSets }} sets total</div>
          </div>
        </div>

        <!-- Mini progress chart -->
        <div class="pr-mini-chart" v-if="pr.history.length > 1">
          <svg :viewBox="`0 0 ${sparkW} 32`" style="width:100%; height:32px; overflow:visible;">
            <polyline
              :points="sparkPoints(pr.history)"
              fill="none"
              stroke="#6c5ce7"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- last point dot -->
            <circle
              v-if="pr.history.length"
              :cx="sparkX(pr.history.length - 1, pr.history.length)"
              :cy="sparkY(pr.history[pr.history.length-1].maxWeight, pr.history)"
              r="3"
              fill="#6c5ce7"
            />
          </svg>
        </div>
        <div v-else class="pr-mini-chart" style="display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--text-3);">
          Log more sessions to see trend
        </div>

        <!-- Footer -->
        <div class="pr-card-footer">
          <span style="font-size:11px; color:var(--text-3);">
            PR set {{ pr.prDate ? formatDate(pr.prDate) : '—' }}
          </span>
          <span style="font-size:11px; color:var(--primary); font-weight:600;">View history →</span>
        </div>
      </div>
    </div>

    <!-- ── Detail drawer ── -->
    <el-drawer
      v-model="drawerOpen"
      direction="rtl"
      size="480px"
      :destroy-on-close="true"
    >
      <template #header>
        <div style="display:flex; align-items:center; gap:10px;">
          <span
            v-if="selectedPR?.muscle"
            class="muscle-tag"
            :style="{ background: muscleStyle(selectedPR.muscle).bg, color: muscleStyle(selectedPR.muscle).color, borderColor: muscleStyle(selectedPR.muscle).border }"
          >{{ selectedPR.muscle }}</span>
          <span style="font-size:16px; font-weight:700; color:var(--text-1);">{{ selectedPR?.name }}</span>
        </div>
      </template>

      <div v-if="selectedPR" style="padding:20px; display:flex; flex-direction:column; gap:20px;">

        <!-- PR headline stats -->
        <div class="detail-stat-row">
          <div class="detail-stat">
            <div class="detail-stat-val">{{ selectedPR.bestWeight > 0 ? selectedPR.bestWeight + ' kg' : '—' }}</div>
            <div class="detail-stat-key">Best weight</div>
            <div class="detail-stat-sub" v-if="selectedPR.bestWeightReps">{{ selectedPR.bestWeightReps }} reps</div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-val">{{ selectedPR.bestReps || '—' }}</div>
            <div class="detail-stat-key">Best rep count</div>
            <div class="detail-stat-sub" v-if="selectedPR.bestRepsWeight">@ {{ selectedPR.bestRepsWeight }} kg</div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-val">{{ selectedPR.totalSessions }}</div>
            <div class="detail-stat-key">Sessions</div>
            <div class="detail-stat-sub">{{ selectedPR.totalSets }} total sets</div>
          </div>
        </div>

        <!-- Weight over time chart -->
        <div class="detail-card">
          <div class="detail-card-header">
            <span class="detail-card-title">Weight over time</span>
            <span class="detail-card-sub">max weight per session</span>
          </div>
          <div style="padding:16px;">
            <canvas v-if="selectedPR.history.length >= 2" ref="detailChartCanvas" style="width:100%; height:200px;" />
            <div v-else style="height:80px; display:flex; align-items:center; justify-content:center; font-size:13px; color:var(--text-3);">
              Need at least 2 sessions to show trend
            </div>
          </div>
        </div>

        <!-- Session history table -->
        <div class="detail-card">
          <div class="detail-card-header">
            <span class="detail-card-title">Session history</span>
          </div>
          <table class="detail-table">
            <thead>
              <tr>
                <th>Date</th>
                <th style="text-align:center;">Max weight</th>
                <th style="text-align:center;">Max reps</th>
                <th style="text-align:center;">vs PR</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(h, i) in [...selectedPR.history].reverse()"
                :key="h.date"
                :class="{ 'pr-row': isPREntry(selectedPR, h) }"
              >
                <td style="font-size:13px; color:var(--text-2);">{{ formatDate(h.date) }}</td>
                <td style="text-align:center; font-size:14px; font-weight:700; color:var(--text-1);">
                  {{ h.maxWeight > 0 ? h.maxWeight + ' kg' : '—' }}
                </td>
                <td style="text-align:center; font-size:13px; color:var(--text-2);">{{ h.maxReps }}</td>
                <td style="text-align:center;">
                  <span v-if="isPREntry(selectedPR, h)" class="pr-badge-table">🏆 PR</span>
                  <span v-else style="color:var(--text-3); font-size:12px;">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { computePRs } from '../composables/usePRs.js';
import { muscleStyle, MUSCLE_COLORS } from '../data/workoutPlan.js';

const props = defineProps({ sessions: Array, plan: Object });

// ── Filters ────────────────────────────────────────────────────────────────
const search      = ref('');
const filterMuscle = ref('');
const sortBy      = ref('weight');

// ── PR data ────────────────────────────────────────────────────────────────
const prs = computed(() => computePRs(props.sessions));

const prList = computed(() => Object.values(prs.value));

const muscleOptions = computed(() => [...new Set(prList.value.map(p => p.muscle).filter(Boolean))].sort());

const filteredPRs = computed(() => {
  let list = prList.value;

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }

  if (filterMuscle.value) {
    list = list.filter(p => p.muscle === filterMuscle.value);
  }

  switch (sortBy.value) {
    case 'weight':   return [...list].sort((a, b) => b.bestWeight - a.bestWeight);
    case 'recent':   return [...list].sort((a, b) => (b.prDate || '').localeCompare(a.prDate || ''));
    case 'sessions': return [...list].sort((a, b) => b.totalSessions - a.totalSessions);
    case 'alpha':    return [...list].sort((a, b) => a.name.localeCompare(b.name));
    default:         return list;
  }
});

// ── Stat computations ──────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  if (!d) return '—';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m)-1]} ${y}`;
}

const thisMonth = new Date().toISOString().slice(0, 7);

const prsThisMonth = computed(() =>
  prList.value.filter(p => p.prDate?.startsWith(thisMonth)).length
);

const totalSetsLogged = computed(() =>
  prList.value.reduce((a, p) => a + p.totalSets, 0)
);

const mostImproved = computed(() => {
  const withHistory = prList.value.filter(p => p.history.length >= 2);
  if (!withHistory.length) return null;

  let best = null, bestGain = 0;
  withHistory.forEach(p => {
    const first = p.history[0].maxWeight;
    const last  = p.history[p.history.length - 1].maxWeight;
    const gain  = first > 0 ? ((last - first) / first) * 100 : 0;
    if (gain > bestGain) { bestGain = gain; best = p.name; }
  });
  return best;
});

function isRecentPR(pr) {
  if (!pr.prDate) return false;
  const days = (Date.now() - new Date(pr.prDate).getTime()) / 86400000;
  return days <= 14;
}

function isPREntry(pr, h) {
  return h.maxWeight >= pr.bestWeight && h.maxReps >= pr.bestWeightReps;
}

// ── Sparkline helpers ──────────────────────────────────────────────────────
const sparkW = 120;

function sparkX(i, total) {
  return total <= 1 ? sparkW / 2 : (i / (total - 1)) * sparkW;
}

function sparkY(val, history) {
  const weights = history.map(h => h.maxWeight).filter(w => w > 0);
  if (!weights.length) return 16;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  if (max === min) return 16;
  return 28 - ((val - min) / (max - min)) * 24;
}

function sparkPoints(history) {
  const filtered = history.filter(h => h.maxWeight > 0);
  if (filtered.length < 2) return '';
  return filtered
    .map((h, i) => `${sparkX(i, filtered.length)},${sparkY(h.maxWeight, filtered)}`)
    .join(' ');
}

// ── Detail drawer ──────────────────────────────────────────────────────────
const drawerOpen       = ref(false);
const selectedPR       = ref(null);
const detailChartCanvas = ref(null);
let chartInstance      = null;

function openDetail(pr) {
  selectedPR.value = pr;
  drawerOpen.value = true;
}

async function renderDetailChart() {
  if (!selectedPR.value || selectedPR.value.history.length < 2) return;
  await nextTick();
  if (!detailChartCanvas.value) return;

  const { Chart, registerables } = await import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.esm.js');
  Chart.register(...registerables);
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const history = selectedPR.value.history.filter(h => h.maxWeight > 0);
  const labels  = history.map(h => {
    const [,m,d] = h.date.split('-');
    return `${Number(d)} ${MONTHS[Number(m)-1]}`;
  });

  chartInstance = new Chart(detailChartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Max weight (kg)',
          data: history.map(h => h.maxWeight),
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.07)',
          borderWidth: 2.5,
          pointBackgroundColor: history.map(h => isPREntry(selectedPR.value, h) ? '#f59e0b' : '#6c5ce7'),
          pointRadius: history.map(h => isPREntry(selectedPR.value, h) ? 7 : 4),
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} kg`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { size: 11 }, callback: v => v + ' kg' },
          suggestedMin: Math.min(...history.map(h => h.maxWeight)) - 2.5,
          suggestedMax: Math.max(...history.map(h => h.maxWeight)) + 2.5,
        },
      },
    },
  });
}

watch([drawerOpen, selectedPR], ([open]) => {
  if (open) renderDetailChart();
});
</script>

<style scoped>
/* ── Stats bar ── */
.pr-stats-bar {
  display: flex;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  gap: 0;
}

.pr-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pr-stat-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}

.pr-stat-val  { font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -0.4px; line-height: 1; }
.pr-stat-key  { font-size: 11px; color: var(--text-3); font-weight: 600; margin-top: 3px; }
.pr-divider   { width: 1px; height: 44px; background: var(--border); flex-shrink: 0; margin: 0 20px; }

/* ── Grid ── */
.pr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) { .pr-grid { grid-template-columns: repeat(2, 1fr); } }

/* ── Card ── */
.pr-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  flex-direction: column;
}

.pr-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: #c5b8fb;
}

.pr-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px 10px;
  gap: 8px;
}

.pr-ex-name { font-size: 14px; font-weight: 800; color: var(--text-1); line-height: 1.3; }

.pr-badge-new {
  font-size: 9px; font-weight: 800;
  background: #fbbf24; color: #78350f;
  border-radius: 20px; padding: 3px 8px;
  flex-shrink: 0; letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Card stats row */
.pr-card-stats {
  display: flex;
  align-items: center;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  gap: 0;
}

.pr-main-stat { flex: 1; text-align: center; }
.pr-main-val  { font-size: 20px; font-weight: 800; color: var(--text-1); letter-spacing: -0.3px; line-height: 1; }
.pr-main-key  { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
.pr-main-sub  { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.pr-stat-divider-v { width: 1px; height: 36px; background: var(--border); flex-shrink: 0; }

/* Mini chart */
.pr-mini-chart {
  padding: 8px 12px 4px;
  height: 48px;
  display: flex;
  align-items: center;
}

/* Footer */
.pr-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid var(--border);
  margin-top: auto;
}

/* Muscle tag */
.muscle-tag {
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  border: 1px solid; white-space: nowrap;
}

/* ── Detail drawer ── */
.detail-stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.detail-stat {
  padding: 16px;
  text-align: center;
  border-right: 1px solid var(--border);
}

.detail-stat:last-child { border-right: none; }

.detail-stat-val { font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -0.4px; line-height: 1; }
.detail-stat-key { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
.detail-stat-sub { font-size: 12px; color: var(--text-3); margin-top: 3px; }

.detail-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.detail-card-title { font-size: 13px; font-weight: 700; color: var(--text-1); }
.detail-card-sub   { font-size: 12px; color: var(--text-3); }

.detail-table { width: 100%; border-collapse: collapse; }

.detail-table thead th {
  text-align: left; padding: 8px 14px;
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.6px;
  background: var(--surface); border-bottom: 1px solid var(--border);
}

.detail-table tbody tr td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.detail-table tbody tr:last-child td { border-bottom: none; }
.detail-table tbody tr:hover td { background: #fafbff; }
.detail-table tbody tr.pr-row td { background: #fffbeb; }
.detail-table tbody tr.pr-row:hover td { background: #fef9e0; }

.pr-badge-table {
  font-size: 11px; font-weight: 700;
  background: #fef3c7; color: #92400e;
  border: 1px solid #fbbf24;
  border-radius: 6px; padding: 2px 8px;
}
</style>
