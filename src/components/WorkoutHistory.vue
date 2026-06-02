<template>
  <div>
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div>
        <div style="font-size:20px; font-weight:800; color:#1a1a2e;">History</div>
        <div style="font-size:13px; color:#aaa; margin-top:2px;">{{ sessions.length }} sessions logged</div>
      </div>
      <!-- Filter -->
      <el-select v-model="filterDay" placeholder="All days" clearable size="small" style="width:130px;">
        <el-option v-for="n in 6" :key="n" :label="`Day ${n}`" :value="n" />
        <el-option label="Custom" value="custom" />
      </el-select>
    </div>

    <el-empty v-if="!filteredSessions.length" description="No workouts yet. Start logging!" :image-size="90" style="margin-top:40px;" />

    <!-- Session groups by month -->
    <template v-for="(group, month) in groupedSessions" :key="month">
      <div style="font-size:12px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:0.8px; margin:16px 0 8px;">
        {{ month }}
      </div>

      <div v-for="s in group" :key="s.id" class="history-session">
        <div class="history-session-header">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <div
                style="width:8px; height:8px; border-radius:50%; flex-shrink:0;"
                :style="{ background: dayColorFor(s) }"
              />
              <div class="history-day-label">{{ s.dayLabel }}</div>
            </div>
            <div class="history-date" style="margin-top:2px; margin-left:14px;">
              {{ formatDate(s.date) }} · {{ s.exercises.length }} exercises · {{ totalSets(s) }} sets
              <span v-if="s.cardio.treadmill.done || s.cardio.cycling.done"> · cardio ✓</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <el-button size="small" :icon="Edit" plain @click="$emit('edit', s)">Edit</el-button>
            <el-popconfirm title="Delete this session?" @confirm="$emit('delete', s.id)">
              <template #reference>
                <el-button size="small" :icon="Delete" plain type="danger" />
              </template>
            </el-popconfirm>
          </div>
        </div>

        <!-- Expandable detail -->
        <el-collapse-transition>
          <div v-if="expanded.has(s.id)" style="border-top:1px solid #f5f6fa;">
            <div v-for="ex in s.exercises" :key="ex.id"
              style="padding:8px 14px; border-bottom:1px solid #f5f6fa; last-child:border-none;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:14px; font-weight:600;">{{ ex.name }}</span>
                <el-tag :type="ex.type === 'Compound' ? 'warning' : 'info'" size="small" effect="plain">{{ ex.type }}</el-tag>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                <el-tag
                  v-for="(set, i) in ex.sets" :key="i"
                  size="small"
                  :type="set.reps ? 'success' : 'info'"
                  effect="light"
                >
                  Set {{ i+1 }}: {{ set.reps || '–' }} reps
                  <span v-if="set.weight">@ {{ set.weight }}kg</span>
                </el-tag>
              </div>
            </div>

            <!-- Cardio detail -->
            <div v-if="s.cardio.treadmill.done || s.cardio.cycling.done"
              style="padding:8px 14px; background:#f9fbff; font-size:13px; color:#666; display:flex; gap:16px;">
              <span v-if="s.cardio.treadmill.done">🏃 Treadmill {{ s.cardio.treadmill.duration }} min</span>
              <span v-if="s.cardio.cycling.done">🚴 Cycling {{ s.cardio.cycling.duration }} min</span>
            </div>

            <!-- Notes -->
            <div v-if="s.notes" style="padding:8px 14px; font-size:13px; color:#888; font-style:italic;">
              "{{ s.notes }}"
            </div>
          </div>
        </el-collapse-transition>

        <!-- Toggle expand -->
        <div
          style="padding:6px 14px; text-align:center; cursor:pointer; font-size:12px; color:#aaa;"
          @click="toggleExpand(s.id)"
        >
          {{ expanded.has(s.id) ? '▲ Less' : '▼ Details' }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Edit, Delete } from '@element-plus/icons-vue';

const props = defineProps({ sessions: Array, plan: Object });
const emit = defineEmits(['edit', 'delete']);

const filterDay = ref(null);
const expanded = ref(new Set());

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
    const key = `${monthName(Number(m))} ${y}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
});

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthName(m) { return MONTHS[m - 1] || ''; }

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${Number(day)} ${monthName(Number(m))} ${y}`;
}

function dayColorFor(s) {
  if (s.dayNumber && props.plan[s.dayNumber]) return props.plan[s.dayNumber].color;
  return '#fd79a8';
}

function totalSets(s) {
  return s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
}

function toggleExpand(id) {
  const s = new Set(expanded.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expanded.value = s;
}
</script>
