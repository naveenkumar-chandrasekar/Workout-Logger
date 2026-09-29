/**
 * useCalories — calorie burn estimation and daily food aggregation.
 *
 * Burn prefers session.burn — an LLM (Groq) estimate computed from the actual
 * sets/reps/weight and cardio at save time — and falls back to the ACSM MET
 * formula (kcal/min = MET × 3.5 × bodyweight(kg) / 200) for sessions saved
 * before that existed. Cardio duration is whatever was logged; resistance
 * duration is set count × MINUTES_PER_SET, a flat cap since sessions aren't
 * timed per set.
 */

export const CARDIO_METS = { treadmill: 7.0, jogging: 9.0, cycling: 7.0 };
export const RESISTANCE_MET  = 5.0;
export const MINUTES_PER_SET = 1;
export const DEFAULT_BODY_WEIGHT = 70;

function metKcal(met, kg, minutes) {
  return (met * 3.5 * kg) / 200 * minutes;
}

function isWorkedSet(set) {
  const reps = String(set.reps).trim();
  return reps !== '' && reps !== '0';
}

function sessionWorkedSets(session) {
  return (session.exercises || []).reduce(
    (a, ex) => a + ex.sets.filter(isWorkedSet).length,
    0
  );
}

export function latestBodyWeight(bodyWeights) {
  if (!bodyWeights?.length) return DEFAULT_BODY_WEIGHT;
  const sorted = [...bodyWeights].sort((a, b) => {
    const da = `${a.date} ${a.time || '00:00'}`;
    const db = `${b.date} ${b.time || '00:00'}`;
    return db.localeCompare(da);
  });
  return Number(sorted[0].weight) || DEFAULT_BODY_WEIGHT;
}

export function estimateSessionBurn(session, kg = DEFAULT_BODY_WEIGHT) {
  if (Number.isFinite(session?.burn?.calories)) return Math.round(session.burn.calories);

  let kcal = 0;

  const workedSets = sessionWorkedSets(session);
  if (workedSets) kcal += metKcal(RESISTANCE_MET, kg, workedSets * MINUTES_PER_SET);

  Object.entries(session.cardio || {}).forEach(([key, c]) => {
    if (c?.done) kcal += metKcal(CARDIO_METS[key] ?? 6, kg, Number(c.duration) || 0);
  });

  return Math.round(kcal);
}

export function estimateDayBurn(sessions, date, kg = DEFAULT_BODY_WEIGHT) {
  return (sessions || [])
    .filter(s => s.date === date)
    .reduce((a, s) => a + estimateSessionBurn(s, kg), 0);
}

export function burnBreakdown(sessions, date, kg = DEFAULT_BODY_WEIGHT) {
  const onDate = (sessions || []).filter(s => s.date === date);

  const sets = onDate.reduce(
    (a, s) => a + s.exercises.reduce(
      (b, ex) => b + ex.sets.filter(x => String(x.reps).trim() !== '' && String(x.reps).trim() !== '0').length, 0
    ), 0
  );

  const cardioMinutes = onDate.reduce(
    (a, s) => a + Object.values(s.cardio || {}).reduce((b, c) => b + (c?.done ? Number(c.duration) || 0 : 0), 0), 0
  );

  const resistanceMinutes = onDate.reduce((a, s) => a + sessionWorkedSets(s) * MINUTES_PER_SET, 0);

  const resistanceKcal = Math.round(onDate.reduce((a, s) => {
    if (Number.isFinite(s.burn?.resistanceCalories)) return a + s.burn.resistanceCalories;
    return a + metKcal(RESISTANCE_MET, kg, sessionWorkedSets(s) * MINUTES_PER_SET);
  }, 0));

  const cardioKcal = Math.round(onDate.reduce((a, s) => {
    if (Number.isFinite(s.burn?.cardioCalories)) return a + s.burn.cardioCalories;
    return a + Object.entries(s.cardio || {}).reduce(
      (b, [key, c]) => b + (c?.done ? metKcal(CARDIO_METS[key] ?? 6, kg, Number(c.duration) || 0) : 0), 0
    );
  }, 0));

  return { sessions: onDate.length, sets, cardioMinutes, resistanceMinutes, resistanceKcal, cardioKcal };
}

export function dayTotals(entries, date) {
  const onDate = (entries || []).filter(e => e.date === date);
  return {
    count:    onDate.length,
    calories: Math.round(onDate.reduce((a, e) => a + (Number(e.calories) || 0), 0)),
    protein:  +onDate.reduce((a, e) => a + (Number(e.protein) || 0), 0).toFixed(1),
    carbs:    +onDate.reduce((a, e) => a + (Number(e.carbs)   || 0), 0).toFixed(1),
    fat:      +onDate.reduce((a, e) => a + (Number(e.fat)     || 0), 0).toFixed(1),
  };
}
