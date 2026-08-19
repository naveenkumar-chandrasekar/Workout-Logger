<template>
  <div class="fade-up">

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-title">Food Log</div>
        <div class="page-subtitle">Describe what you ate — Groq works out the calories · Target {{ target }} kcal/day</div>
      </div>
      <div class="page-header-actions">
        <el-button :icon="ArrowLeft" circle plain size="small" @click="shiftDay(-1)" />
        <el-date-picker
          v-model="selectedDate"
          type="date"
          format="DD MMM YYYY"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width:170px;"
        />
        <el-button :icon="ArrowRight" circle plain size="small" :disabled="selectedDate >= todayIso" @click="shiftDay(1)" />
        <el-button v-if="selectedDate !== todayIso" size="small" plain style="border-radius:8px;" @click="selectedDate = todayIso">Today</el-button>
      </div>
    </div>

    <!-- Stat row -->
    <div class="fd-stats-row">
      <div class="fd-stat">
        <div class="fd-stat-label">Consumed</div>
        <div class="fd-stat-val">{{ totals.calories }}</div>
        <div class="fd-stat-sub">kcal from {{ totals.count }} {{ totals.count === 1 ? 'entry' : 'entries' }}</div>
      </div>
      <div class="fd-stat-divider" />
      <div class="fd-stat">
        <div class="fd-stat-label">Burned</div>
        <div class="fd-stat-val">{{ burn }}</div>
        <div class="fd-stat-sub">{{ breakdown.sessions ? `${breakdown.sessions} session${breakdown.sessions > 1 ? 's' : ''}` : 'no training' }}</div>
      </div>
      <div class="fd-stat-divider" />
      <div class="fd-stat">
        <div class="fd-stat-label">Allowance</div>
        <div class="fd-stat-val">{{ allowance }}</div>
        <div class="fd-stat-sub">{{ target }} target + {{ burn }} burn</div>
      </div>
      <div class="fd-stat-divider" />
      <div class="fd-stat">
        <div class="fd-stat-label">{{ balance >= 0 ? 'Deficit' : 'Surplus' }}</div>
        <div class="fd-stat-val" :class="balance >= 0 ? 'down-text' : 'up-text'">
          {{ balance >= 0 ? '−' : '+' }}{{ Math.abs(balance) }}
        </div>
        <div class="fd-stat-sub">{{ balance >= 0 ? 'under allowance' : 'over allowance' }}</div>
      </div>
      <div class="fd-stat-divider" />
      <div class="fd-stat">
        <div class="fd-stat-label">Macros</div>
        <div class="fd-stat-val" style="font-size:18px;">{{ totals.protein }}<span class="fd-unit">p</span></div>
        <div class="fd-stat-sub">{{ totals.carbs }}g carbs · {{ totals.fat }}g fat</div>
      </div>
    </div>

    <!-- Allowance bar -->
    <div class="fd-bar-card">
      <div class="fd-bar-head">
        <span class="fd-bar-title">{{ totals.calories }} / {{ allowance }} kcal</span>
        <span class="fd-bar-pct" :class="{ over: totals.calories > allowance }">{{ pct }}%</span>
      </div>
      <div class="fd-bar-track">
        <div class="fd-bar-fill" :class="{ over: totals.calories > allowance }" :style="{ width: Math.min(100, pct) + '%' }" />
      </div>
      <div class="fd-strip-wrap" :class="{ 'fade-l': canScrollLeft, 'fade-r': canScrollRight }">
      <div ref="stripEl" class="fd-week-strip" :style="{ '--strip-visible': STRIP_WINDOW }" @scroll.passive="onStripScroll">
        <div
          v-for="d in dayStrip"
          :key="d.date"
          :data-date="d.date"
          class="fd-week-day"
          :class="{ active: d.date === selectedDate, today: d.date === todayIso }"
          :title="`${formatDate(d.date)} — ${d.consumed} / ${d.allowance} kcal`"
          @click="selectedDate = d.date"
        >
          <div class="fd-week-bar-wrap">
            <div class="fd-week-bar" :class="{ over: d.consumed > d.allowance }" :style="{ height: d.height + '%' }" />
          </div>
          <div class="fd-week-name">{{ d.name }}</div>
          <div class="fd-week-date">{{ d.dayNum }}{{ d.showMonth ? ' ' + d.month : '' }}</div>
          <div class="fd-week-val">{{ d.consumed || '—' }}</div>
        </div>
      </div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="fd-grid">

      <!-- LEFT -->
      <div style="display:flex; flex-direction:column; gap:16px; min-width:0;">

        <!-- Composer -->
        <div class="card">
          <div class="card-header fd-card-header">
            <div>
              <div class="card-title">Add food</div>
              <div class="card-sub">Plain English — quantities help but aren't required</div>
            </div>
          </div>
          <div class="card-body">
            <el-input
              v-model="draft"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="e.g. 2 chapati with dal, a cup of curd and 2 boiled eggs"
              @keydown.ctrl.enter="addEntry"
              @keydown.meta.enter="addEntry"
            />
            <div class="fd-composer-actions">
              <span class="fd-hint">
                <template v-if="isLateNight && selectedDate === todayIso">
                  🌙 Late night — logging to <strong>{{ formatDate(todayIso) }}</strong>
                </template>
                <template v-else-if="selectedDate !== todayIso">
                  Logging to <strong>{{ formatDate(selectedDate) }}</strong>
                </template>
                <template v-else>⌘/Ctrl + Enter to analyze</template>
              </span>
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="analyzing"
                :disabled="!draft.trim()"
                style="height:38px; font-weight:700; border-radius:9px; min-width:150px;"
                @click="addEntry"
              >{{ analyzing ? 'Analyzing…' : 'Analyze calories' }}</el-button>
            </div>
          </div>
        </div>

        <!-- Entries -->
        <div class="card">
          <div class="card-header fd-card-header">
            <div>
              <div class="card-title">{{ formatDate(selectedDate) }}</div>
              <div class="card-sub">{{ totals.count }} {{ totals.count === 1 ? 'entry' : 'entries' }} · {{ totals.calories }} kcal</div>
            </div>
          </div>

          <div v-if="!dayEntries.length" class="fd-empty">
            <div style="font-size:40px; margin-bottom:10px;">🍽️</div>
            <div style="font-size:15px; font-weight:700; color:var(--text-1); margin-bottom:4px;">Nothing logged for this day</div>
            <div style="font-size:13px;">Describe a meal above and hit <strong>Analyze calories</strong>.</div>
          </div>

          <div v-for="entry in dayEntries" :key="entry.id" class="fd-entry">

            <!-- Read mode -->
            <template v-if="editingId !== entry.id">
              <div class="fd-entry-main" @click="toggleExpand(entry.id)">
                <div class="fd-entry-left">
                  <span class="fd-chevron" :class="{ open: expanded.has(entry.id) }">▶</span>
                  <div style="min-width:0;">
                    <div class="fd-entry-text">{{ entry.text }}</div>
                    <div class="fd-entry-meta">
                      <span>{{ entry.time || '—' }}</span>
                      <span v-if="entry.items?.length">· {{ entry.items.length }} item{{ entry.items.length > 1 ? 's' : '' }}</span>
                      <span>· {{ entry.protein }}p / {{ entry.carbs }}c / {{ entry.fat }}f</span>
                    </div>
                  </div>
                </div>
                <div class="fd-entry-right">
                  <div class="fd-kcal">{{ entry.calories }}<span class="fd-unit">kcal</span></div>
                  <el-button :icon="Edit"   plain size="small" circle @click.stop="startEdit(entry)" title="Edit & recompute" />
                  <el-button :icon="Delete" plain size="small" circle type="danger" @click.stop="removeEntry(entry)" title="Delete" />
                </div>
              </div>

              <div v-show="expanded.has(entry.id)" class="fd-entry-detail">
                <table v-if="entry.items?.length" class="fd-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="width:110px;">Qty</th>
                      <th style="width:70px; text-align:right;">kcal</th>
                      <th style="width:56px; text-align:right;">P</th>
                      <th style="width:56px; text-align:right;">C</th>
                      <th style="width:56px; text-align:right;">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in entry.items" :key="i">
                      <td class="fd-item-name">{{ item.name }}</td>
                      <td class="fd-item-qty">{{ item.qty }}</td>
                      <td style="text-align:right; font-weight:700;">{{ item.calories }}</td>
                      <td style="text-align:right;">{{ item.protein }}</td>
                      <td style="text-align:right;">{{ item.carbs }}</td>
                      <td style="text-align:right;">{{ item.fat }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="fd-no-items">No item breakdown stored for this entry.</div>
                <div v-if="entry.notes" class="fd-notes">💡 {{ entry.notes }}</div>
                <div v-if="entry.analyzedAt" class="fd-stamp">Analyzed {{ entry.analyzedAt }}<span v-if="entry.model"> · {{ entry.model }}</span></div>
              </div>
            </template>

            <!-- Edit mode -->
            <div v-else class="fd-edit-block">
              <div class="fd-edit-label">Edit the description, then recompute</div>
              <el-input v-model="editText" type="textarea" :rows="3" resize="none" />
              <div class="fd-edit-actions">
                <el-button size="small" plain style="border-radius:8px;" :disabled="recomputing" @click="cancelEdit">Cancel</el-button>
                <el-button
                  type="primary"
                  size="small"
                  :icon="Refresh"
                  :loading="recomputing"
                  :disabled="!editText.trim()"
                  style="border-radius:8px; font-weight:700;"
                  @click="recompute(entry)"
                >{{ recomputing ? 'Recomputing…' : 'Recompute' }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- Target -->
        <div class="card">
          <div class="card-header fd-card-header">
            <div>
              <div class="card-title">Daily target</div>
              <div class="card-sub">Maintenance calories</div>
            </div>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:12px;">
            <el-input-number
              :model-value="target"
              :min="800" :max="6000" :step="50"
              controls-position="right"
              style="width:100%;"
              @change="v => $emit('update:target', Number(v) || 2200)"
            />
            <div class="fd-target-note">
              Deficit is measured against <strong>target + calories burned training</strong>, so rest days
              automatically get a tighter allowance.
            </div>
          </div>
        </div>

        <!-- Burn breakdown -->
        <div class="card">
          <div class="card-header fd-card-header">
            <div>
              <div class="card-title">Training burn</div>
              <div class="card-sub">{{ formatDate(selectedDate) }}</div>
            </div>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:10px;">
            <div v-if="!breakdown.sessions" class="fd-no-items" style="padding:6px 0;">
              No workout logged on this day — allowance is just your target.
            </div>
            <template v-else>
              <div class="fd-burn-row">
                <span class="fd-burn-key">Resistance</span>
                <span class="fd-burn-sub">{{ breakdown.sets }} sets ≈ {{ breakdown.sets * 3 }} min</span>
                <span class="fd-burn-val">{{ breakdown.resistanceKcal }}</span>
              </div>
              <div class="fd-burn-row">
                <span class="fd-burn-key">Cardio</span>
                <span class="fd-burn-sub">{{ breakdown.cardioMinutes }} min</span>
                <span class="fd-burn-val">{{ breakdown.cardioKcal }}</span>
              </div>
              <div class="fd-burn-row total">
                <span class="fd-burn-key">Total</span>
                <span class="fd-burn-sub">at {{ kg }} kg</span>
                <span class="fd-burn-val">{{ burn }}</span>
              </div>
            </template>
            <div class="fd-target-note">
              MET-based estimate — resistance work is costed at 3 min per completed set since sessions aren't timed.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowRight, Delete, Edit, Refresh, MagicStick } from '@element-plus/icons-vue';
import { uid } from '../data/workoutPlan.js';
import { analyzeFood } from '../services/foodApi.js';
import { dayTotals, estimateDayBurn, burnBreakdown, latestBodyWeight } from '../composables/useCalories.js';

const props = defineProps({
  modelValue:  Array,
  target:      { type: Number, default: 2200 },
  sessions:    Array,
  bodyWeights: Array,
});
const emit = defineEmits(['update:modelValue', 'update:target']);

const DAY_CUTOFF_HOUR = 4;

function localIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function logicalToday(d = new Date()) {
  const iso = localIso(d);
  return d.getHours() < DAY_CUTOFF_HOUR ? addDays(iso, -1) : iso;
}

const entries      = computed(() => props.modelValue || []);
const todayIso     = ref(logicalToday());
const selectedDate = ref(todayIso.value);
const isLateNight  = ref(new Date().getHours() < DAY_CUTOFF_HOUR);

function syncToday() {
  const next = logicalToday();
  isLateNight.value = new Date().getHours() < DAY_CUTOFF_HOUR;
  if (next === todayIso.value) return;
  const wasOnToday = selectedDate.value === todayIso.value;
  todayIso.value = next;
  if (wasOnToday) selectedDate.value = next;
}

let tick;
const onResize = () => centerSelected('auto');

onMounted(() => {
  tick = setInterval(syncToday, 60_000);
  document.addEventListener('visibilitychange', syncToday);
  window.addEventListener('resize', onResize);
  nextTick(() => centerSelected('auto'));
});
onUnmounted(() => {
  clearInterval(tick);
  document.removeEventListener('visibilitychange', syncToday);
  window.removeEventListener('resize', onResize);
});

const draft       = ref('');
const analyzing   = ref(false);
const editingId   = ref(null);
const editText    = ref('');
const recomputing = ref(false);
const expanded    = ref(new Set());

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDay(n) {
  const iso = addDays(selectedDate.value, n);
  if (iso > todayIso.value) return;
  selectedDate.value = iso;
}

function timeOrder(time) {
  const h = Number((time || '').slice(0, 2));
  if (!Number.isFinite(h)) return -1;
  const mins = Number((time || '').slice(3, 5)) || 0;
  return (h < DAY_CUTOFF_HOUR ? h + 24 : h) * 60 + mins;
}

const dayEntries = computed(() =>
  entries.value
    .filter(e => e.date === selectedDate.value)
    .sort((a, b) => timeOrder(a.time) - timeOrder(b.time))
);

const totals     = computed(() => dayTotals(entries.value, selectedDate.value));
const kg         = computed(() => Math.round(latestBodyWeight(props.bodyWeights)));
const burn       = computed(() => estimateDayBurn(props.sessions, selectedDate.value, kg.value));
const breakdown  = computed(() => burnBreakdown(props.sessions, selectedDate.value, kg.value));
const allowance  = computed(() => props.target + burn.value);
const balance    = computed(() => allowance.value - totals.value.calories);
const pct        = computed(() => (allowance.value ? Math.round((totals.value.calories / allowance.value) * 100) : 0));

const STRIP_DAYS   = 30;
const STRIP_SIDE   = 15;
const STRIP_WINDOW = 7;

function daysBetween(a, b) {
  const ms = new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`);
  return Math.round(ms / 86_400_000);
}

const dayStrip = computed(() => {
  const after  = Math.min(STRIP_SIDE - 1, Math.max(0, daysBetween(selectedDate.value, todayIso.value)));
  const before = STRIP_DAYS - 1 - after;
  const start  = addDays(selectedDate.value, -before);

  const days = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const iso = addDays(start, i);
    const [, m, dd] = iso.split('-');
    return {
      date: iso,
      name: DAYS[new Date(`${iso}T00:00:00`).getDay()],
      dayNum: Number(dd),
      month: MONTHS[Number(m) - 1],
      showMonth: i === 0 || Number(dd) === 1,
      consumed: dayTotals(entries.value, iso).calories,
      allowance: props.target + estimateDayBurn(props.sessions, iso, kg.value),
    };
  });
  const peak = Math.max(...days.map(d => d.consumed), 1);
  return days.map(d => ({ ...d, height: Math.round((d.consumed / peak) * 100) }));
});

const stripEl        = ref(null);
const canScrollLeft  = ref(false);
const canScrollRight = ref(false);

function onStripScroll() {
  const box = stripEl.value;
  if (!box) return;
  canScrollLeft.value  = box.scrollLeft > 4;
  canScrollRight.value = box.scrollLeft + box.clientWidth < box.scrollWidth - 4;
}

function centerSelected(behavior = 'smooth') {
  const box = stripEl.value;
  if (!box) return;
  const cell = box.querySelector(`[data-date="${selectedDate.value}"]`);
  if (!cell) return;
  box.scrollTo({ left: cell.offsetLeft - (box.clientWidth - cell.clientWidth) / 2, behavior });
  setTimeout(onStripScroll, behavior === 'smooth' ? 400 : 0);
}

watch(selectedDate, () => nextTick(centerSelected));

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}

async function addEntry() {
  const text = draft.value.trim();
  if (!text || analyzing.value) return;
  analyzing.value = true;
  try {
    const result = await analyzeFood(text);
    syncToday();
    const entry = {
      id:         uid(),
      date:       selectedDate.value === todayIso.value ? logicalToday() : selectedDate.value,
      time:       nowTime(),
      text,
      calories:   result.calories,
      protein:    result.protein,
      carbs:      result.carbs,
      fat:        result.fat,
      notes:      result.notes,
      model:      result.model,
      analyzedAt: `${formatDate(localIso())} ${nowTime()}`,
      items:      result.items,
    };
    emit('update:modelValue', [...entries.value, entry]);
    expanded.value = new Set([...expanded.value, entry.id]);
    draft.value = '';
    ElMessage.success(`Logged ${result.calories} kcal`);
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    analyzing.value = false;
  }
}

function startEdit(entry) {
  editingId.value = entry.id;
  editText.value  = entry.text;
}

function cancelEdit() {
  editingId.value = null;
  editText.value  = '';
}

async function recompute(entry) {
  const text = editText.value.trim();
  if (!text || recomputing.value) return;
  recomputing.value = true;
  try {
    const result = await analyzeFood(text);
    const updated = entries.value.map(e => e.id === entry.id
      ? {
          ...e,
          text,
          calories:   result.calories,
          protein:    result.protein,
          carbs:      result.carbs,
          fat:        result.fat,
          notes:      result.notes,
          model:      result.model,
          analyzedAt: `${formatDate(localIso())} ${nowTime()}`,
          items:      result.items,
        }
      : e);
    emit('update:modelValue', updated);
    expanded.value = new Set([...expanded.value, entry.id]);
    cancelEdit();
    ElMessage.success(`Recomputed — ${result.calories} kcal`);
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    recomputing.value = false;
  }
}

function removeEntry(entry) {
  ElMessageBox.confirm(`Delete this entry (${entry.calories} kcal)?`, 'Confirm', {
    confirmButtonText: 'Delete',
    cancelButtonText:  'Cancel',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  }).then(() => {
    emit('update:modelValue', entries.value.filter(e => e.id !== entry.id));
    ElMessage.success('Entry deleted');
  }).catch(() => {});
}
</script>

<style scoped>
/* ── Stat row ── */
.fd-stats-row {
  display: flex;
  align-items: stretch;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 18px 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.fd-stat { flex: 1; padding: 0 18px; min-width: 120px; }
.fd-stat-divider { width: 1px; background: var(--border); flex-shrink: 0; }
.fd-stat-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; }
.fd-stat-val   { font-size: 24px; font-weight: 800; color: var(--text-1); letter-spacing: -0.6px; margin-top: 4px; line-height: 1.1; }
.fd-stat-sub   { font-size: 11px; color: var(--text-3); margin-top: 3px; }
.fd-unit       { font-size: 11px; font-weight: 700; color: var(--text-3); margin-left: 3px; }

.down-text { color: var(--success) !important; }
.up-text   { color: var(--danger)  !important; }

/* ── Allowance bar ── */
.fd-bar-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.fd-bar-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.fd-bar-title { font-size: 14px; font-weight: 700; color: var(--text-1); }
.fd-bar-pct { font-size: 13px; font-weight: 700; color: var(--success); }
.fd-bar-pct.over { color: var(--danger); }

.fd-bar-track { height: 10px; background: var(--surface); border-radius: 20px; overflow: hidden; }
.fd-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #60a5fa);
  border-radius: 20px;
  transition: width 0.35s ease;
}
.fd-bar-fill.over { background: linear-gradient(90deg, #f59e0b, var(--danger)); }

/* ── Day strip (7 visible, 30 scrollable) ── */
.fd-strip-wrap { position: relative; }
.fd-strip-wrap::before,
.fd-strip-wrap::after {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 0;
  width: 44px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s;
  z-index: 1;
}
.fd-strip-wrap::before {
  left: 0;
  background: linear-gradient(90deg, var(--card), transparent);
}
.fd-strip-wrap::after {
  right: 0;
  background: linear-gradient(270deg, var(--card), transparent);
}
.fd-strip-wrap.fade-l::before,
.fd-strip-wrap.fade-r::after { opacity: 1; }

.fd-week-strip {
  display: flex;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  padding-bottom: 6px;
}
.fd-week-strip::-webkit-scrollbar { height: 6px; }
.fd-week-strip::-webkit-scrollbar-track { background: transparent; }
.fd-week-strip::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
.fd-week-strip::-webkit-scrollbar-thumb:hover { background: var(--text-3); }

.fd-week-day {
  flex: 0 0 calc((100% - (var(--strip-visible) - 1) * 6px) / var(--strip-visible));
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 2px;
  transition: background 0.14s;
  scroll-snap-align: center;
}
.fd-week-day:hover  { background: var(--surface); }
.fd-week-day.active { background: var(--primary-light); }
.fd-week-day.today .fd-week-name { color: var(--primary); }

.fd-week-bar-wrap { height: 40px; display: flex; align-items: flex-end; justify-content: center; }
.fd-week-bar {
  width: 60%;
  min-height: 3px;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}
.fd-week-bar.over { background: var(--danger); }
.fd-week-name { font-size: 10px; font-weight: 700; color: var(--text-3); text-transform: uppercase; margin-top: 5px; }
.fd-week-date { font-size: 10px; font-weight: 600; color: var(--text-3); white-space: nowrap; }
.fd-week-val  { font-size: 11px; font-weight: 600; color: var(--text-2); }

/* ── Grid ── */
.fd-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }

.fd-card-header { background: var(--surface); }

.fd-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.fd-hint { font-size: 11px; color: var(--text-3); }

.fd-empty { padding: 40px 24px; text-align: center; color: var(--text-3); }

/* ── Entry rows ── */
.fd-entry { border-bottom: 1px solid var(--border); }
.fd-entry:last-child { border-bottom: none; }

.fd-entry-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 20px;
  cursor: pointer;
  transition: background 0.12s;
}
.fd-entry-main:hover { background: var(--surface); }

.fd-entry-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.fd-entry-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.fd-chevron { font-size: 9px; color: var(--text-3); transition: transform 0.2s; flex-shrink: 0; }
.fd-chevron.open { transform: rotate(90deg); }

.fd-entry-text {
  font-size: 14px; font-weight: 600; color: var(--text-1);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fd-entry-meta {
  font-size: 11px; color: var(--text-3); margin-top: 3px;
  display: flex; gap: 5px; flex-wrap: wrap;
}

.fd-kcal { font-size: 17px; font-weight: 800; color: var(--text-1); white-space: nowrap; }

.fd-entry-detail { padding: 4px 20px 16px; background: var(--surface); }

.fd-items-table { width: 100%; border-collapse: collapse; }
.fd-items-table th {
  text-align: left;
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.6px;
  padding: 8px 6px; border-bottom: 1px solid var(--border);
}
.fd-items-table td { padding: 7px 6px; font-size: 12px; color: var(--text-2); border-bottom: 1px solid var(--border); }
.fd-items-table tr:last-child td { border-bottom: none; }
.fd-item-name { font-weight: 600; color: var(--text-1); }
.fd-item-qty  { color: var(--text-3); }

.fd-no-items { font-size: 12px; color: var(--text-3); padding: 10px 6px; }

.fd-notes {
  font-size: 12px; color: var(--text-2);
  background: var(--card); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 10px; margin-top: 10px; line-height: 1.5;
}
.fd-stamp { font-size: 10px; color: var(--text-3); margin-top: 8px; }

/* ── Edit mode ── */
.fd-edit-block { padding: 14px 20px; background: var(--surface); }
.fd-edit-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 8px; }
.fd-edit-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }

/* ── Right column ── */
.fd-target-note { font-size: 11px; color: var(--text-3); line-height: 1.6; }

.fd-burn-row { display: flex; align-items: baseline; gap: 8px; }
.fd-burn-key { font-size: 13px; font-weight: 600; color: var(--text-2); flex-shrink: 0; }
.fd-burn-sub { font-size: 11px; color: var(--text-3); flex: 1; }
.fd-burn-val { font-size: 14px; font-weight: 800; color: var(--text-1); }
.fd-burn-row.total { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 2px; }
.fd-burn-row.total .fd-burn-val { color: var(--primary); }

/* ── Mobile ── */
@media (max-width: 900px) {
  .fd-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .fd-stats-row { padding: 6px 0; }
  .fd-stat { flex: 0 0 33.33%; padding: 10px 6px; text-align: center; min-width: 0; }
  .fd-stat-val { font-size: 19px !important; }
  .fd-stat-divider { display: none; }
  .fd-entry-main { padding: 12px 14px; }
  .fd-entry-detail { padding: 4px 14px 14px; }
  .fd-items-table th:nth-child(2),
  .fd-items-table td:nth-child(2) { display: none; }
  .fd-composer-actions { flex-direction: column-reverse; align-items: stretch; }
  .fd-hint { text-align: center; }
}
</style>
