import * as XLSX from 'xlsx';
import { uid } from '../data/workoutPlan.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function emptyRow(keys) {
  return [Object.fromEntries(keys.map(k => [k, '']))];
}

// ─── Log (sessions) ────────────────────────────────────────────────────────

export function parseLogXlsx(buffer) {
  try {
    const wb      = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const sessWs  = wb.Sheets['Sessions'];
    const setsWs  = wb.Sheets['Sets'];
    if (!sessWs) return [];

    const sessions = XLSX.utils.sheet_to_json(sessWs);
    const sets     = setsWs ? XLSX.utils.sheet_to_json(setsWs) : [];

    return sessions
      .filter(s => s.id)
      .map(s => ({
        id:        s.id,
        date:      String(s.date || ''),
        dayNumber: s.dayNumber ? Number(s.dayNumber) : null,
        dayLabel:  s.dayLabel || '',
        isCustom:  s.isCustom === 'Y',
        notes:     s.notes || '',
        cardio: {
          treadmill: { done: s.treadmill === 'Y', duration: Number(s.treadmillMin) || 15 },
          jogging:   { done: s.jogging   === 'Y', duration: Number(s.joggingMin)   || 20 },
          cycling:   { done: s.cycling   === 'Y', duration: Number(s.cyclingMin)   || 15 },
        },
        exercises: buildExercises(s.id, sets),
      }));
  } catch (e) {
    console.error('parseLogXlsx:', e);
    return [];
  }
}

function buildExercises(sessionId, sets) {
  const rows = sets.filter(r => r.sessionId === sessionId);
  const map  = new Map();
  rows.forEach(r => {
    if (!map.has(r.exercise)) {
      map.set(r.exercise, {
        id:         uid(),
        name:       r.exercise,
        muscle:     r.muscle      || '',
        type:       r.type        || '',
        tip:        r.tip         || '',
        repsTarget: r.repsTarget  || '',
        isCustom:   r.isCustom === 'Y',
        sets:       [],
      });
    }
    map.get(r.exercise).sets.push({
      id:     uid(),
      reps:   r.reps   !== undefined ? String(r.reps)   : '',
      weight: r.weight !== undefined ? String(r.weight) : '',
    });
  });
  return [...map.values()];
}

export function buildLogXlsx(sessions) {
  const wb = XLSX.utils.book_new();

  const sessionRows = sessions.map(s => ({
    id:           s.id,
    date:         s.date,
    dayNumber:    s.dayNumber ?? '',
    dayLabel:     s.dayLabel,
    isCustom:     s.isCustom ? 'Y' : 'N',
    notes:        s.notes || '',
    treadmill:    s.cardio?.treadmill?.done ? 'Y' : 'N',
    treadmillMin: s.cardio?.treadmill?.duration ?? 15,
    jogging:      s.cardio?.jogging?.done   ? 'Y' : 'N',
    joggingMin:   s.cardio?.jogging?.duration   ?? 20,
    cycling:      s.cardio?.cycling?.done   ? 'Y' : 'N',
    cyclingMin:   s.cardio?.cycling?.duration   ?? 15,
  }));

  const setRows = [];
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach((set, i) => {
        setRows.push({
          sessionId:  s.id,
          exercise:   ex.name,
          muscle:     ex.muscle     || '',
          type:       ex.type       || '',
          tip:        ex.tip        || '',
          repsTarget: ex.repsTarget || '',
          isCustom:   ex.isCustom ? 'Y' : 'N',
          setNum:     i + 1,
          reps:       set.reps,
          weight:     set.weight,
        });
      });
    });
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    sessionRows.length ? sessionRows : emptyRow(['id','date','dayNumber','dayLabel','isCustom','notes','treadmill','treadmillMin','jogging','joggingMin','cycling','cyclingMin'])
  ), 'Sessions');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    setRows.length ? setRows : emptyRow(['sessionId','exercise','muscle','type','tip','repsTarget','isCustom','setNum','reps','weight'])
  ), 'Sets');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

// ─── Plan ──────────────────────────────────────────────────────────────────

export function parsePlanXlsx(buffer) {
  try {
    const wb   = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const ws   = wb.Sheets['Plan'];
    if (!ws) return null;
    const rows = XLSX.utils.sheet_to_json(ws);
    const plan = {};
    rows.forEach(r => {
      const d = String(r.day);
      if (!plan[d]) {
        plan[d] = {
          label:    r.dayLabel || '',
          color:    r.color    || '#6c5ce7',
          muscles:  r.muscles  ? r.muscles.split(',') : [],
          coachTip: r.coachTip || '',
          exercises: [],
        };
      }
      if (r.exercise) {
        plan[d].exercises.push({
          name:       r.exercise,
          muscle:     r.muscle     || '',
          sets:       Number(r.sets) || 3,
          repsTarget: String(r.repsTarget || '10'),
          type:       r.type       || 'Isolation',
          tip:        r.tip        || '',
        });
      }
    });
    return Object.keys(plan).length ? plan : null;
  } catch { return null; }
}

export function buildPlanXlsx(plan) {
  const wb   = XLSX.utils.book_new();
  const rows = [];
  Object.entries(plan).forEach(([day, d]) => {
    d.exercises.forEach(ex => {
      rows.push({
        day:       Number(day),
        dayLabel:  d.label,
        color:     d.color,
        muscles:   d.muscles.join(','),
        coachTip:  d.coachTip,
        exercise:  ex.name,
        muscle:    ex.muscle     || '',
        sets:      ex.sets,
        repsTarget: ex.repsTarget,
        type:      ex.type,
        tip:       ex.tip        || '',
      });
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    rows.length ? rows : emptyRow(['day','dayLabel','color','muscles','coachTip','exercise','muscle','sets','repsTarget','type','tip'])
  ), 'Plan');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

// ─── Body weight ───────────────────────────────────────────────────────────

export function parseBodyWeightXlsx(buffer) {
  try {
    const wb      = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const weightsWs  = wb.Sheets['Weights'];
    const settingsWs = wb.Sheets['Settings'];

    const weights  = weightsWs  ? XLSX.utils.sheet_to_json(weightsWs)  : [];
    const settings = settingsWs ? XLSX.utils.sheet_to_json(settingsWs) : [];

    const goal = settings.find(r => r.key === 'weightGoal')?.value ?? 74;

    return {
      weights: weights
        .filter(r => r.date && r.weight)
        .map(r => ({
          id:     r.id || `${r.date}-${r.time || '00:00'}-${Math.random().toString(36).slice(2,6)}`,
          date:   String(r.date),
          time:   r.time   || '',
          weight: Number(r.weight),
          note:   r.note   || '',
        })),
      goal: Number(goal),
    };
  } catch { return { weights: [], goal: 74 }; }
}

export function buildBodyWeightXlsx(weights, goal = 74) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    weights.length
      ? weights.map(w => ({ id: w.id || '', date: w.date, time: w.time || '', weight: w.weight, note: w.note || '' }))
      : emptyRow(['id','date','time','weight','note'])
  ), 'Weights');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { key: 'weightGoal', value: goal },
  ]), 'Settings');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

// ─── Templates ─────────────────────────────────────────────────────────────

export function parseTemplatesXlsx(buffer) {
  try {
    const wb      = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const tplWs   = wb.Sheets['Templates'];
    const exWs    = wb.Sheets['Exercises'];
    if (!tplWs) return [];

    const tplRows = XLSX.utils.sheet_to_json(tplWs);
    const exRows  = exWs ? XLSX.utils.sheet_to_json(exWs) : [];

    return tplRows.filter(t => t.id).map(t => ({
      id:        t.id,
      name:      t.name      || '',
      muscles:   t.muscles   ? t.muscles.split(',') : [],
      createdAt: t.createdAt || '',
      usedCount: Number(t.usedCount) || 0,
      exercises: exRows
        .filter(e => e.templateId === t.id)
        .map(e => ({
          name:       e.name       || '',
          muscle:     e.muscle     || '',
          type:       e.type       || 'Isolation',
          sets:       Number(e.sets) || 3,
          repsTarget: String(e.repsTarget || '10'),
          tip:        e.tip        || '',
        })),
    }));
  } catch { return []; }
}

export function buildTemplatesXlsx(templates) {
  const wb = XLSX.utils.book_new();

  const tplRows = templates.map(t => ({
    id:        t.id,
    name:      t.name,
    muscles:   (t.muscles || []).join(','),
    createdAt: t.createdAt || '',
    usedCount: t.usedCount || 0,
  }));

  const exRows = [];
  templates.forEach(t => {
    (t.exercises || []).forEach(ex => {
      exRows.push({
        templateId: t.id,
        name:       ex.name,
        muscle:     ex.muscle     || '',
        type:       ex.type       || '',
        sets:       ex.sets,
        repsTarget: ex.repsTarget || '10',
        tip:        ex.tip        || '',
      });
    });
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    tplRows.length ? tplRows : emptyRow(['id','name','muscles','createdAt','usedCount'])
  ), 'Templates');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    exRows.length ? exRows : emptyRow(['templateId','name','muscle','type','sets','repsTarget','tip'])
  ), 'Exercises');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
