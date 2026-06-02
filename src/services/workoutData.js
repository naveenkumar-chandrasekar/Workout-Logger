import * as XLSX from 'xlsx';
import { uid } from '../data/workoutPlan.js';

// ─── Log (sessions) ────────────────────────────────────────────────────────

export function parseLogXlsx(buffer) {
  try {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sessionsWs = wb.Sheets['Sessions'];
    const setsWs = wb.Sheets['Sets'];
    if (!sessionsWs) return [];

    const sessions = XLSX.utils.sheet_to_json(sessionsWs);
    const sets = setsWs ? XLSX.utils.sheet_to_json(setsWs) : [];

    return sessions
      .filter((s) => s.id)
      .map((s) => ({
        id: s.id,
        date: String(s.date || ''),
        dayNumber: s.dayNumber ? Number(s.dayNumber) : null,
        dayLabel: s.dayLabel || '',
        isCustom: s.isCustom === 'Y',
        notes: s.notes || '',
        cardio: {
          treadmill: { done: s.treadmill === 'Y', duration: Number(s.treadmillMin) || 15 },
          jogging:   { done: s.jogging === 'Y',   duration: Number(s.joggingMin) || 20 },
          cycling:   { done: s.cycling === 'Y',   duration: Number(s.cyclingMin) || 15 },
        },
        exercises: buildExercises(s.id, sets),
      }));
  } catch (e) {
    console.error('parseLogXlsx:', e);
    return [];
  }
}

function buildExercises(sessionId, sets) {
  const rows = sets.filter((r) => r.sessionId === sessionId);
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.exercise)) {
      map.set(r.exercise, {
        id: uid(),
        name: r.exercise,
        type: r.type || '',
        tip: r.tip || '',
        repsTarget: r.repsTarget || '',
        isCustom: r.isCustom === 'Y',
        sets: [],
      });
    }
    map.get(r.exercise).sets.push({
      id: uid(),
      reps: r.reps !== undefined ? String(r.reps) : '',
      weight: r.weight !== undefined ? String(r.weight) : '',
    });
  });
  return [...map.values()];
}

export function buildLogXlsx(sessions) {
  const wb = XLSX.utils.book_new();

  const sessionRows = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    dayNumber: s.dayNumber ?? '',
    dayLabel: s.dayLabel,
    isCustom: s.isCustom ? 'Y' : 'N',
    notes: s.notes || '',
    treadmill: s.cardio?.treadmill?.done ? 'Y' : 'N',
    treadmillMin: s.cardio?.treadmill?.duration ?? 15,
    jogging: s.cardio?.jogging?.done ? 'Y' : 'N',
    joggingMin: s.cardio?.jogging?.duration ?? 20,
    cycling: s.cardio?.cycling?.done ? 'Y' : 'N',
    cyclingMin: s.cardio?.cycling?.duration ?? 15,
  }));

  const setRows = [];
  sessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      ex.sets.forEach((set, i) => {
        setRows.push({
          sessionId: s.id,
          exercise: ex.name,
          type: ex.type || '',
          tip: ex.tip || '',
          repsTarget: ex.repsTarget || '',
          isCustom: ex.isCustom ? 'Y' : 'N',
          setNum: i + 1,
          reps: set.reps,
          weight: set.weight,
        });
      });
    });
  });

  const sRows = sessionRows.length ? sessionRows : [{ id: '', date: '', dayNumber: '', dayLabel: '', isCustom: '', notes: '', treadmill: '', treadmillMin: '', cycling: '', cyclingMin: '' }];
  const eRows = setRows.length ? setRows : [{ sessionId: '', exercise: '', type: '', tip: '', repsTarget: '', isCustom: '', setNum: '', reps: '', weight: '' }];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sRows), 'Sessions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eRows), 'Sets');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

// ─── Plan ──────────────────────────────────────────────────────────────────

export function parsePlanXlsx(buffer) {
  try {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const ws = wb.Sheets['Plan'];
    if (!ws) return null;
    const rows = XLSX.utils.sheet_to_json(ws);
    const plan = {};
    rows.forEach((r) => {
      const d = String(r.day);
      if (!plan[d]) {
        plan[d] = {
          label: r.dayLabel || '',
          color: r.color || '#6c5ce7',
          muscles: r.muscles ? r.muscles.split(',') : [],
          coachTip: r.coachTip || '',
          exercises: [],
        };
      }
      if (r.exercise) {
        plan[d].exercises.push({
          name: r.exercise,
          muscle: r.muscle || '',
          sets: Number(r.sets) || 3,
          repsTarget: String(r.repsTarget || '10'),
          type: r.type || 'Isolation',
          tip: r.tip || '',
        });
      }
    });
    return Object.keys(plan).length ? plan : null;
  } catch (e) {
    return null;
  }
}

export function buildPlanXlsx(plan) {
  const wb = XLSX.utils.book_new();
  const rows = [];
  Object.entries(plan).forEach(([day, d]) => {
    d.exercises.forEach((ex) => {
      rows.push({
        day: Number(day),
        dayLabel: d.label,
        color: d.color,
        muscles: d.muscles.join(','),
        coachTip: d.coachTip,
        exercise: ex.name,
        muscle: ex.muscle || '',
        sets: ex.sets,
        repsTarget: ex.repsTarget,
        type: ex.type,
        tip: ex.tip || '',
      });
    });
  });
  const r = rows.length ? rows : [{ day: '', dayLabel: '', color: '', muscles: '', coachTip: '', exercise: '', sets: '', repsTarget: '', type: '', tip: '' }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(r), 'Plan');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
