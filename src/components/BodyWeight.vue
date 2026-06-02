<template>
  <div class="fade-up">

    <!-- Header -->
    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:16px;">
      <div>
        <div class="page-title">Body Weight</div>
        <div class="page-subtitle">Track your weight over time · Goal: {{ goal }} kg</div>
      </div>
    </div>

    <!-- Stat cards row -->
    <div class="bw-stats-row">
      <div class="bw-stat">
        <div class="bw-stat-label">Current</div>
        <div class="bw-stat-val">{{ latest ? latest.weight + ' kg' : '—' }}</div>
        <div class="bw-stat-sub">{{ latest ? formatDate(latest.date) : 'Not logged yet' }}</div>
      </div>
      <div class="bw-stat-divider" />
      <div class="bw-stat">
        <div class="bw-stat-label">Starting</div>
        <div class="bw-stat-val">{{ earliest ? earliest.weight + ' kg' : '—' }}</div>
        <div class="bw-stat-sub">{{ earliest ? formatDate(earliest.date) : '' }}</div>
      </div>
      <div class="bw-stat-divider" />
      <div class="bw-stat">
        <div class="bw-stat-label">Change</div>
        <div class="bw-stat-val" :class="changeClass">{{ changeStr }}</div>
        <div class="bw-stat-sub">since start</div>
      </div>
      <div class="bw-stat-divider" />
      <div class="bw-stat">
        <div class="bw-stat-label">7-day avg</div>
        <div class="bw-stat-val">{{ avg7 ? avg7 + ' kg' : '—' }}</div>
        <div class="bw-stat-sub">rolling average</div>
      </div>
      <div class="bw-stat-divider" />
      <div class="bw-stat">
        <div class="bw-stat-label">30-day avg</div>
        <div class="bw-stat-val">{{ avg30 ? avg30 + ' kg' : '—' }}</div>
        <div class="bw-stat-sub">rolling average</div>
      </div>
      <div class="bw-stat-divider" />
      <div class="bw-stat">
        <div class="bw-stat-label">Entries</div>
        <div class="bw-stat-val">{{ weights.length }}</div>
        <div class="bw-stat-sub">days logged</div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="bw-grid">

      <!-- LEFT: chart + log -->
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Chart card -->
        <div class="bw-card">
          <div class="bw-card-header">
            <span class="bw-card-title">Weight trend</span>
            <div style="display:flex; gap:6px;">
              <el-button
                v-for="r in ranges"
                :key="r.val"
                :type="chartRange === r.val ? 'primary' : 'default'"
                size="small"
                plain
                style="border-radius:8px; min-width:44px;"
                @click="chartRange = r.val"
              >{{ r.label }}</el-button>
            </div>
          </div>
          <div style="padding:16px 18px;">
            <div v-if="chartData.length < 2" style="height:200px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px;">
              Log at least 2 entries to see the trend chart.
            </div>
            <canvas v-else ref="chartCanvas" style="width:100%; height:220px;" />
          </div>
        </div>

        <!-- History table -->
        <div class="bw-card">
          <div class="bw-card-header">
            <span class="bw-card-title">Weight log</span>
            <span class="bw-card-sub">{{ weights.length }} entries</span>
          </div>
          <div v-if="!weights.length" style="padding:32px; text-align:center; color:var(--text-3); font-size:13px;">
            No entries yet. Log your first weight on the right.
          </div>
          <table v-else class="bw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th style="text-align:center;">Weight (kg)</th>
                <th style="text-align:center;">Change</th>
                <th style="text-align:center;">vs 74 kg goal</th>
                <th style="text-align:right; width:60px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in sortedWeights" :key="entry.date" class="bw-table-row">
                <td>
                  <span style="font-size:13px; font-weight:600; color:var(--text-2);">{{ formatDate(entry.date) }}</span>
                  <el-tag v-if="idx === 0" size="small" type="success" effect="light" style="margin-left:6px;">Latest</el-tag>
                </td>
                <td style="text-align:center; font-size:15px; font-weight:800; color:var(--text-1);">
                  {{ entry.weight }}
                </td>
                <td style="text-align:center;">
                  <span v-if="idx < sortedWeights.length - 1"
                    :class="['bw-delta', getDelta(idx) > 0 ? 'up' : getDelta(idx) < 0 ? 'down' : 'flat']">
                    {{ getDelta(idx) > 0 ? '+' : '' }}{{ getDelta(idx).toFixed(1) }} kg
                  </span>
                  <span v-else style="color:var(--text-3); font-size:12px;">—</span>
                </td>
                <td style="text-align:center;">
                  <span
                    :class="['bw-delta', entry.weight > goal ? 'up' : entry.weight < goal ? 'down' : 'flat']"
                  >
                    {{ entry.weight > goal ? '+' : '' }}{{ (entry.weight - goal).toFixed(1) }} kg
                  </span>
                </td>
                <td style="text-align:right;">
                  <el-button
                    :icon="Delete"
                    size="small"
                    type="danger"
                    plain
                    circle
                    @click="deleteEntry(entry.date)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- RIGHT: log panel -->
      <div>
        <div class="bw-card" style="position:sticky; top:0;">
          <div class="bw-card-header">
            <span class="bw-card-title">Log weight</span>
          </div>
          <div style="padding:20px 18px; display:flex; flex-direction:column; gap:16px;">
            <div>
              <div class="bw-field-label">Date</div>
              <el-date-picker
                v-model="form.date"
                type="date"
                format="DD MMM YYYY"
                value-format="YYYY-MM-DD"
                :clearable="false"
                style="width:100%;"
              />
            </div>

            <div>
              <div class="bw-field-label">Weight (kg)</div>
              <el-input-number
                v-model="form.weight"
                :min="30"
                :max="200"
                :step="0.1"
                :precision="1"
                controls-position="right"
                style="width:100%;"
                size="large"
              />
            </div>

            <div>
              <div class="bw-field-label">Note (optional)</div>
              <el-input v-model="form.note" placeholder="e.g. after workout, morning" />
            </div>

            <el-button
              type="primary"
              :disabled="!form.weight"
              style="width:100%; height:42px; font-weight:700; border-radius:10px;"
              @click="logEntry"
            >
              Save Entry
            </el-button>

            <!-- Goal setting -->
            <div>
              <div class="bw-field-label">Target weight (kg)</div>
              <el-input-number
                :model-value="goal"
                :min="30" :max="200" :step="0.5" :precision="1"
                controls-position="right"
                style="width:100%;"
                @change="v => goal = v"
              />
            </div>

            <!-- Goal indicator -->
            <div class="goal-box">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:700; color:var(--text-2);">Goal: {{ goal }} kg</span>
                <span style="font-size:12px; color:var(--text-3);">
                  {{ latest ? Math.abs(latest.weight - goal).toFixed(1) + ' kg ' + (latest.weight > goal ? 'above' : latest.weight < goal ? 'below' : '✓ on target') : '—' }}
                </span>
              </div>
              <div style="background:var(--border); border-radius:99px; height:8px; overflow:hidden; position:relative;">
                <div
                  style="height:100%; border-radius:99px; transition:width 0.4s; background:#6c5ce7;"
                  :style="{ width: goalProgress + '%' }"
                />
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10px; color:var(--text-3);">
                <span>{{ goalMin }} kg</span>
                <span>{{ goal }} kg ✓</span>
                <span>{{ goalMax }} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';

const props  = defineProps({ modelValue: Array, goal: { type: Number, default: 74 } });
const emit   = defineEmits(['update:modelValue', 'update:goal']);

// ── Local state ────────────────────────────────────────────────────────────
const weights    = computed(() => props.modelValue || []);
const chartCanvas = ref(null);
const chartRange  = ref(30);
const ranges      = [
  { label: '7D',  val: 7  },
  { label: '30D', val: 30 },
  { label: '90D', val: 90 },
  { label: 'All', val: 9999 },
];

const goal    = computed({ get: () => props.goal, set: v => emit('update:goal', v) });
const goalMin = computed(() => Math.round(props.goal - 10));
const goalMax = computed(() => Math.round(props.goal + 10));

const form = ref({ date: new Date().toISOString().slice(0, 10), weight: props.goal, note: '' });

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m)-1]} ${y}`;
}

// ── Sorted data ────────────────────────────────────────────────────────────
const sortedWeights = computed(() =>
  [...weights.value].sort((a, b) => b.date.localeCompare(a.date))
);

const latest   = computed(() => sortedWeights.value[0] || null);
const earliest = computed(() => sortedWeights.value[sortedWeights.value.length - 1] || null);

function getDelta(idx) {
  const cur  = sortedWeights.value[idx].weight;
  const prev = sortedWeights.value[idx + 1]?.weight;
  return prev !== undefined ? +(cur - prev).toFixed(2) : 0;
}

// ── Stats ──────────────────────────────────────────────────────────────────
const changeStr = computed(() => {
  if (!latest.value || !earliest.value || latest.value.date === earliest.value.date) return '—';
  const d = +(latest.value.weight - earliest.value.weight).toFixed(1);
  return (d > 0 ? '+' : '') + d + ' kg';
});

const changeClass = computed(() => {
  if (!latest.value || !earliest.value) return '';
  const d = latest.value.weight - earliest.value.weight;
  return d > 0.2 ? 'up-text' : d < -0.2 ? 'down-text' : 'flat-text';
});

function rollingAvg(days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const recent = weights.value.filter(w => w.date >= cutoff);
  if (!recent.length) return null;
  return (recent.reduce((a, w) => a + w.weight, 0) / recent.length).toFixed(1);
}

const avg7  = computed(() => rollingAvg(7));
const avg30 = computed(() => rollingAvg(30));

const goalProgress = computed(() => {
  if (!latest.value) return 50;
  const w   = latest.value.weight;
  const min = goalMin.value;
  const max = goalMax.value;
  return Math.min(100, Math.max(0, ((w - min) / (max - min)) * 100));
});

// ── Chart data ─────────────────────────────────────────────────────────────
const chartData = computed(() => {
  const cutoff = chartRange.value === 9999
    ? '0000-00-00'
    : new Date(Date.now() - chartRange.value * 86400000).toISOString().slice(0, 10);
  return [...weights.value]
    .filter(w => w.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
});

// ── Log / delete ───────────────────────────────────────────────────────────
function logEntry() {
  if (!form.value.weight) return;
  const exists = weights.value.find(w => w.date === form.value.date);
  let updated;
  if (exists) {
    updated = weights.value.map(w =>
      w.date === form.value.date ? { ...w, weight: form.value.weight, note: form.value.note } : w
    );
  } else {
    updated = [...weights.value, { date: form.value.date, weight: form.value.weight, note: form.value.note || '' }];
  }
  emit('update:modelValue', updated);
  ElMessage.success(exists ? 'Entry updated!' : 'Weight logged!');
}

function deleteEntry(date) {
  emit('update:modelValue', weights.value.filter(w => w.date !== date));
}

// ── Chart rendering ────────────────────────────────────────────────────────
let chartInstance = null;

async function renderChart() {
  if (chartData.value.length < 2) return;
  await nextTick();
  if (!chartCanvas.value) return;

  const { Chart, registerables } = await import('https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.esm.js');
  Chart.register(...registerables);

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const labels = chartData.value.map(w => {
    const [,m,d] = w.date.split('-');
    return `${Number(d)} ${MONTHS[Number(m)-1]}`;
  });
  const data   = chartData.value.map(w => w.weight);
  const avg7Val = avg7.value ? Number(avg7.value) : null;

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data,
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#6c5ce7',
          pointRadius: data.length > 30 ? 0 : 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
        },
        {
          label: `${props.goal} kg target`,
          data: Array(data.length).fill(props.goal),
          borderColor: '#10b981',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a2e',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.7)',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 } } },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { size: 11 }, callback: v => v + ' kg' },
          suggestedMin: Math.min(...data) - 1,
          suggestedMax: Math.max(...data) + 1,
        },
      },
    },
  });
}

watch([chartData, chartCanvas], () => { if (chartData.value.length >= 2) renderChart(); }, { immediate: true });
onMounted(() => { if (chartData.value.length >= 2) renderChart(); });
</script>

<style scoped>
.bw-stats-row {
  display: flex;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 28px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.bw-stat { flex: 1; text-align: center; }
.bw-stat-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 6px; }
.bw-stat-val   { font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -0.4px; }
.bw-stat-sub   { font-size: 11px; color: var(--text-3); margin-top: 3px; }
.bw-stat-divider { width: 1px; height: 44px; background: var(--border); flex-shrink: 0; margin: 0 4px; }

.up-text   { color: #dc2626; }
.down-text { color: #10b981; }
.flat-text { color: var(--text-2); }

.bw-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.bw-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.bw-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  gap: 12px;
}

.bw-card-title { font-size: 14px; font-weight: 700; color: var(--text-1); }
.bw-card-sub   { font-size: 12px; color: var(--text-3); }

.bw-field-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 6px; }

.bw-table { width: 100%; border-collapse: collapse; }

.bw-table thead th {
  padding: 10px 16px;
  font-size: 11px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.6px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.bw-table-row td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.bw-table-row:last-child td { border-bottom: none; }
.bw-table-row:hover td { background: #fafbff; }

.bw-delta {
  font-size: 12px; font-weight: 700;
  padding: 2px 8px; border-radius: 6px;
}

.bw-delta.up   { background: #fee2e2; color: #dc2626; }
.bw-delta.down { background: #d1fae5; color: #059669; }
.bw-delta.flat { background: var(--surface); color: var(--text-3); }

.goal-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}
</style>
