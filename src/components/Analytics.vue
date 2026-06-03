<template>
  <div class="fade-up">
    <!-- Header -->
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:16px; flex-wrap:wrap;">
      <div>
        <div class="page-title">Progress & Analytics</div>
        <div class="page-subtitle">Track how your strength improves over time</div>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <el-select v-model="selectedExercise" placeholder="Select exercise…" filterable clearable style="width:240px;">
          <el-option v-for="ex in allExercises" :key="ex" :label="ex" :value="ex" />
        </el-select>
        <el-select v-model="rangeWeeks" style="width:130px;">
          <el-option label="Last 4 weeks"  :value="4" />
          <el-option label="Last 8 weeks"  :value="8" />
          <el-option label="Last 12 weeks" :value="12" />
          <el-option label="All time"      :value="999" />
        </el-select>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="analytics-stats-row">
      <div class="an-stat">
        <div class="an-stat-val">{{ totalSessions }}</div>
        <div class="an-stat-key">Sessions logged</div>
      </div>
      <div class="an-divider" />
      <div class="an-stat">
        <div class="an-stat-val">{{ totalSets }}</div>
        <div class="an-stat-key">Total sets</div>
      </div>
      <div class="an-divider" />
      <div class="an-stat">
        <div class="an-stat-val">{{ totalVolume.toLocaleString() }} kg</div>
        <div class="an-stat-key">Total volume lifted</div>
      </div>
      <div class="an-divider" />
      <div class="an-stat">
        <div class="an-stat-val">{{ avgSessionsPerWeek }}</div>
        <div class="an-stat-key">Sessions / week avg</div>
      </div>
    </div>

    <div class="analytics-grid">
      <!-- Left col -->
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Exercise volume chart -->
        <div class="an-card">
          <div class="an-card-header">
            <div>
              <div class="an-card-title">{{ selectedExercise || 'Select an exercise' }} — weight over time</div>
              <div class="an-card-sub">Max weight lifted per session</div>
            </div>
          </div>
          <div style="padding:16px;">
            <div v-if="!selectedExercise" style="height:180px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px;">
              Pick an exercise from the dropdown above
            </div>
            <div v-else-if="exerciseHistory.length < 2" style="height:180px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px;">
              Need at least 2 sessions to show trend
            </div>
            <canvas v-else ref="exerciseChartRef" style="width:100%; height:200px;" />
          </div>
          <!-- Overload indicator -->
          <div v-if="selectedExercise && exerciseHistory.length >= 2" class="overload-bar">
            <span v-if="weightDelta > 0" style="color:var(--success); font-weight:700;">
              ↑ +{{ weightDelta }} kg over {{ exerciseHistory.length }} sessions — progressing!
            </span>
            <span v-else-if="weightDelta < 0" style="color:var(--warning); font-weight:700;">
              ↓ {{ weightDelta }} kg — consider progressive overload
            </span>
            <span v-else style="color:var(--text-3);">
              Weight stable — consider adding 2.5 kg next session
            </span>
          </div>
        </div>

        <!-- Weekly training frequency -->
        <div class="an-card">
          <div class="an-card-header">
            <div class="an-card-title">Weekly training frequency</div>
            <div class="an-card-sub">Sessions per week</div>
          </div>
          <div style="padding:16px;">
            <canvas v-if="weeklyFreqData.length" ref="freqChartRef" style="width:100%; height:180px;" />
            <div v-else style="height:100px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px;">
              Log more sessions to see frequency
            </div>
          </div>
        </div>

      </div>

      <!-- Right col -->
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Volume by muscle group -->
        <div class="an-card">
          <div class="an-card-header">
            <div class="an-card-title">Volume by muscle group</div>
            <div class="an-card-sub">Total sets in selected period</div>
          </div>
          <div style="padding:16px;">
            <canvas v-if="muscleVolumeData.length" ref="muscleChartRef" style="width:100%; height:220px;" />
            <div v-else style="height:100px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px;">
              No data
            </div>
          </div>
        </div>

        <!-- Top exercises by volume -->
        <div class="an-card">
          <div class="an-card-header">
            <div class="an-card-title">Most trained exercises</div>
            <div class="an-card-sub">By total sets in selected period</div>
          </div>
          <div>
            <div v-for="(ex, i) in topExercises" :key="ex.name" class="top-ex-row">
              <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <div class="top-rank">{{ i + 1 }}</div>
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--text-1);">{{ ex.name }}</div>
                  <div style="font-size:11px; color:var(--text-3); margin-top:1px;">{{ ex.sessions }} sessions · {{ ex.sets }} sets</div>
                </div>
              </div>
              <div style="flex:1; max-width:120px; background:var(--border); border-radius:99px; height:6px; overflow:hidden;">
                <div style="height:100%; border-radius:99px; background:var(--primary); transition:width 0.4s;"
                  :style="{ width: (ex.sets / topExercises[0].sets * 100) + '%' }" />
              </div>
              <span style="font-size:12px; font-weight:700; color:var(--text-2); width:30px; text-align:right;">{{ ex.sets }}</span>
            </div>
            <div v-if="!topExercises.length" style="padding:20px; text-align:center; color:var(--text-3); font-size:13px;">
              No data for selected period
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({ sessions: Array, plan: Object });

const selectedExercise = ref('');
const rangeWeeks       = ref(8);

// ── Date helpers ───────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isoWeek(dateStr) {
  const d  = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2,'0')}`;
}

const cutoff = computed(() => {
  if (rangeWeeks.value === 999) return '0000-00-00';
  return new Date(Date.now() - rangeWeeks.value * 7 * 86400000).toISOString().slice(0, 10);
});

const filteredSessions = computed(() =>
  props.sessions.filter(s => s.date >= cutoff.value)
);

// ── Summary stats ──────────────────────────────────────────────────────────
const totalSessions = computed(() => filteredSessions.value.length);

const totalSets = computed(() =>
  filteredSessions.value.reduce((a, s) => a + s.exercises.reduce((b, ex) => b + ex.sets.length, 0), 0)
);

const totalVolume = computed(() =>
  filteredSessions.value.reduce((a, s) =>
    a + s.exercises.reduce((b, ex) =>
      b + ex.sets.reduce((c, set) => c + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0), 0)
);

const avgSessionsPerWeek = computed(() => {
  if (!filteredSessions.value.length) return 0;
  const weeks = rangeWeeks.value === 999 ? 12 : rangeWeeks.value;
  return (filteredSessions.value.length / weeks).toFixed(1);
});

// ── All exercises dropdown ─────────────────────────────────────────────────
const allExercises = computed(() => {
  const set = new Set();
  props.sessions.forEach(s => s.exercises.forEach(ex => set.add(ex.name)));
  return [...set].sort();
});

// ── Exercise history ───────────────────────────────────────────────────────
const exerciseHistory = computed(() => {
  if (!selectedExercise.value) return [];
  return [...filteredSessions.value]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(s => s.exercises.some(ex => ex.name === selectedExercise.value))
    .map(s => {
      const ex = s.exercises.find(e => e.name === selectedExercise.value);
      const maxW = Math.max(...ex.sets.map(st => Number(st.weight) || 0));
      return { date: s.date, maxWeight: maxW };
    })
    .filter(h => h.maxWeight > 0);
});

const weightDelta = computed(() => {
  if (exerciseHistory.value.length < 2) return 0;
  return +(exerciseHistory.value[exerciseHistory.value.length - 1].maxWeight - exerciseHistory.value[0].maxWeight).toFixed(1);
});

// ── Weekly frequency ───────────────────────────────────────────────────────
const weeklyFreqData = computed(() => {
  const map = {};
  filteredSessions.value.forEach(s => {
    const w = isoWeek(s.date);
    map[w] = (map[w] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
});

// ── Muscle volume ──────────────────────────────────────────────────────────
const muscleVolumeData = computed(() => {
  const map = {};
  filteredSessions.value.forEach(s =>
    s.exercises.forEach(ex => {
      const m = ex.muscle || 'Other';
      map[m] = (map[m] || 0) + ex.sets.length;
    })
  );
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
});

// ── Top exercises ──────────────────────────────────────────────────────────
const topExercises = computed(() => {
  const map = {};
  filteredSessions.value.forEach(s =>
    s.exercises.forEach(ex => {
      if (!map[ex.name]) map[ex.name] = { name: ex.name, sets: 0, sessions: 0 };
      map[ex.name].sets += ex.sets.length;
      map[ex.name].sessions++;
    })
  );
  return Object.values(map).sort((a, b) => b.sets - a.sets).slice(0, 8);
});

// ── Charts ─────────────────────────────────────────────────────────────────
const exerciseChartRef = ref(null);
const freqChartRef     = ref(null);
const muscleChartRef   = ref(null);
let charts = {};

const MUSCLE_COLORS_MAP = {
  Core: '#15803d', Chest: '#c0256f', Shoulder: '#3451b2', Triceps: '#6741d9',
  Back: '#1a7f4b', Biceps: '#b45309', Legs: '#c2410c', Other: '#9399a8',
};

async function loadChart() {
  const { Chart, registerables } = await import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.esm.js');
  Chart.register(...registerables);
  return Chart;
}

async function renderExerciseChart() {
  if (!selectedExercise.value || exerciseHistory.value.length < 2) return;
  await nextTick();
  if (!exerciseChartRef.value) return;
  const Chart = await loadChart();
  if (charts.exercise) { charts.exercise.destroy(); }
  const labels = exerciseHistory.value.map(h => {
    const [,m,d] = h.date.split('-');
    return `${Number(d)} ${MONTHS[Number(m)-1]}`;
  });
  charts.exercise = new Chart(exerciseChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Max weight (kg)',
        data: exerciseHistory.value.map(h => h.maxWeight),
        borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.08)',
        borderWidth: 2.5, tension: 0.35, fill: true,
        pointBackgroundColor: '#6c5ce7', pointRadius: exerciseHistory.value.length > 20 ? 0 : 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.7)', padding: 10, cornerRadius: 8 } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: v => v + ' kg' },
          suggestedMin: Math.min(...exerciseHistory.value.map(h => h.maxWeight)) - 2.5,
          suggestedMax: Math.max(...exerciseHistory.value.map(h => h.maxWeight)) + 2.5 },
      },
    },
  });
}

async function renderFreqChart() {
  if (!weeklyFreqData.value.length) return;
  await nextTick();
  if (!freqChartRef.value) return;
  const Chart = await loadChart();
  if (charts.freq) { charts.freq.destroy(); }
  charts.freq = new Chart(freqChartRef.value, {
    type: 'bar',
    data: {
      labels: weeklyFreqData.value.map(([w]) => w.replace(/\d{4}-W/, 'Wk ')),
      datasets: [{ label: 'Sessions', data: weeklyFreqData.value.map(([,v]) => v), backgroundColor: '#a29bfe', borderRadius: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, stepSize: 1 }, min: 0 },
      },
    },
  });
}

async function renderMuscleChart() {
  if (!muscleVolumeData.value.length) return;
  await nextTick();
  if (!muscleChartRef.value) return;
  const Chart = await loadChart();
  if (charts.muscle) { charts.muscle.destroy(); }
  const colors = muscleVolumeData.value.map(([m]) => MUSCLE_COLORS_MAP[m] || '#9399a8');
  charts.muscle = new Chart(muscleChartRef.value, {
    type: 'doughnut',
    data: {
      labels: muscleVolumeData.value.map(([m]) => m),
      datasets: [{ data: muscleVolumeData.value.map(([,v]) => v), backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } } },
    },
  });
}

watch([selectedExercise, exerciseHistory], renderExerciseChart);
watch([weeklyFreqData, freqChartRef], ([data, el]) => { if (data.length && el) renderFreqChart(); }, { immediate: true });
watch([muscleVolumeData, muscleChartRef], ([data, el]) => { if (data.length && el) renderMuscleChart(); }, { immediate: true });
watch(rangeWeeks, () => {
  renderFreqChart();
  renderMuscleChart();
  if (selectedExercise.value) renderExerciseChart();
});
</script>

<style scoped>
.analytics-stats-row {
  display: flex; align-items: center;
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px 24px;
  margin-bottom: 24px; box-shadow: var(--shadow-sm);
}
.an-stat { flex: 1; text-align: center; }
.an-stat-val { font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -0.4px; line-height: 1; }
.an-stat-key { font-size: 11px; color: var(--text-3); font-weight: 600; margin-top: 4px; }
.an-divider  { width: 1px; height: 40px; background: var(--border); flex-shrink: 0; margin: 0 4px; }

.analytics-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;
}
@media (max-width: 900px) { .analytics-grid { grid-template-columns: 1fr !important; } }

.an-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);
}
.an-card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--surface);
}
.an-card-title { font-size: 14px; font-weight: 700; color: var(--text-1); }
.an-card-sub   { font-size: 12px; color: var(--text-3); margin-top: 2px; }

.overload-bar {
  padding: 10px 18px; font-size: 12px;
  border-top: 1px solid var(--border); background: var(--surface);
}

.top-ex-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 18px; border-bottom: 1px solid var(--border); transition: background 0.1s;
}
.top-ex-row:last-child { border-bottom: none; }
.top-ex-row:hover { background: var(--surface); }

.top-rank {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
</style>
