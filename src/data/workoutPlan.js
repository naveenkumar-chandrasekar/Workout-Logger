export const DEFAULT_PLAN = {
  1: {
    label: 'Chest · Shoulder · Triceps',
    color: '#6c5ce7',
    muscles: ['Chest', 'Shoulder', 'Triceps'],
    coachTip: 'Start with compound presses while fresh. Rest 90 sec between compound sets, 60 sec on isolation.',
    exercises: [
      { name: 'Flat Bench Press',      sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '45–60 kg · controlled descent · retract scapula' },
      { name: 'Neutral Bench Press',   sets: 3, repsTarget: '10',   type: 'Isolation', tip: 'Neutral grip · feel the stretch at bottom' },
      { name: 'Shoulder Press',        sets: 4, repsTarget: '10',   type: 'Compound',  tip: "30–40 kg · don't lock out fully at top" },
      { name: 'Reverse Flyes',         sets: 3, repsTarget: '12-15',type: 'Isolation', tip: 'Light weight · squeeze rear delts at top' },
      { name: 'Cable Pushdown',        sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Keep elbows pinned tight to sides' },
      { name: 'DB Overhead Extension', sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Single dumbbell · full range of motion' },
    ],
  },
  2: {
    label: 'Back · Biceps · Legs',
    color: '#00b894',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Do heavy rows and squats first. Rest 90–120 sec for compounds, 60 sec for arms.',
    exercises: [
      { name: 'Front Pulldown',  sets: 4, repsTarget: '10',   type: 'Compound',  tip: 'Wide grip · pull bar to upper chest' },
      { name: 'T-Bar Row',       sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '50–70 kg · hinge at hips · neutral spine' },
      { name: 'Front Pull-Up',   sets: 3, repsTarget: 'max',  type: 'Compound',  tip: 'Bodyweight or assisted · full hang at bottom' },
      { name: 'Barbell Curl',    sets: 3, repsTarget: '10',   type: 'Isolation', tip: '20–25 kg · strict form · no swinging' },
      { name: 'DB Hammer Curl',  sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Neutral grip · slow eccentric · brachialis focus' },
      { name: 'Free Squat',      sets: 4, repsTarget: '10',   type: 'Compound',  tip: '50–60 kg · depth below parallel · brace core' },
      { name: 'Machine Squat',   sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Higher rep finish to pump quads' },
    ],
  },
  3: {
    label: 'Chest · Shoulder · Biceps · Triceps',
    color: '#e17055',
    muscles: ['Chest', 'Shoulder', 'Biceps', 'Triceps'],
    coachTip: 'Arnold Press replaces Upright Row to avoid overlap with Day 1 shoulder pressing.',
    exercises: [
      { name: 'Incline Chest Press',   sets: 4, repsTarget: '10', type: 'Compound',  tip: '30–40° incline · targets upper chest' },
      { name: 'Bench Bend Arm Curl',   sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Full stretch at bottom of each rep' },
      { name: 'Arnold Press',          sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Full delt rotation · 12–16 kg DBs' },
      { name: 'Lateral Raise',         sets: 3, repsTarget: '15', type: 'Isolation', tip: '8–10 kg · slight bend in elbow · thumbs neutral' },
      { name: 'Skull Crusher',         sets: 3, repsTarget: '12', type: 'Isolation', tip: 'EZ bar 20–25 kg · lower bar to forehead' },
      { name: 'DB Kickback',           sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Squeeze hard at full extension' },
    ],
  },
  4: {
    label: 'Back · Biceps · Legs',
    color: '#0984e3',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Complement to Day 2 with different angles. Close-grip pulldown hits lats differently from wide grip.',
    exercises: [
      { name: 'Close-Grip Pulldown', sets: 4, repsTarget: '10', type: 'Compound',  tip: 'V-bar · elbows drive straight down' },
      { name: 'Seated Row',          sets: 4, repsTarget: '10', type: 'Compound',  tip: "Retract scapula fully · don't round back" },
      { name: 'Preacher Curl',       sets: 3, repsTarget: '10', type: 'Isolation', tip: 'Full stretch at bottom · strict form' },
      { name: 'DB Alternate Curl',   sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Supinate wrist at top of each rep' },
      { name: 'Leg Extension',       sets: 3, repsTarget: '15', type: 'Isolation', tip: 'Quad isolation · squeeze hard at top' },
      { name: 'Leg Press',           sets: 4, repsTarget: '12', type: 'Compound',  tip: '80–100 kg · feet shoulder-width' },
    ],
  },
  5: {
    label: 'Chest · Shoulder · Triceps',
    color: '#a29bfe',
    muscles: ['Chest', 'Shoulder', 'Triceps'],
    coachTip: 'Face pulls protect shoulder health — never skip. High Extension complements Day 1 Cable Pushdown.',
    exercises: [
      { name: 'Decline Press',    sets: 4, repsTarget: '10',  type: 'Compound',  tip: 'Targets lower chest · keep elbows at 75°' },
      { name: 'Chest Flyes',      sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Dumbbells or cables · full arc · slight bend' },
      { name: 'Face Pull',        sets: 3, repsTarget: '15',  type: 'Isolation', tip: 'Rope · pull to forehead · external rotation' },
      { name: 'Front Raise',      sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Alternating · 8–10 kg · slow and controlled' },
      { name: 'High Extension',   sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Cable overhead · elbows close · long head focus' },
      { name: 'Dips',             sets: 3, repsTarget: 'max', type: 'Compound',  tip: 'Bodyweight or weighted · slight forward lean' },
    ],
  },
  6: {
    label: 'Back · Biceps · Legs',
    color: '#00cec9',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Straight-Arm Pulldown replaces Back Pulldown — avoids a third lat pulldown variation across the week.',
    exercises: [
      { name: 'Straight-Arm Pulldown', sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Cable · different lat movement pattern' },
      { name: 'Dumbbell Row',          sets: 4, repsTarget: '10', type: 'Compound',  tip: '25–35 kg single arm · elbow past torso' },
      { name: 'Overhead Cable Curl',   sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Cable at head height · long head bicep focus' },
      { name: 'Concentration Curl',    sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Slow and deliberate · peak contraction' },
      { name: 'Leg Curl',              sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Hamstring isolation · full range of motion' },
      { name: 'Calf Raises',           sets: 3, repsTarget: '20', type: 'Isolation', tip: 'Slow tempo · pause at top and bottom' },
    ],
  },
};

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeSets(count) {
  return Array.from({ length: count }, () => ({ id: uid(), reps: '', weight: '' }));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function sessionFromPlan(dayNum, plan, date) {
  const day = plan[dayNum];
  return {
    id: uid(),
    date: date || today(),
    dayNumber: Number(dayNum),
    dayLabel: day.label,
    isCustom: false,
    exercises: day.exercises.map((ex) => ({
      id: uid(),
      name: ex.name,
      type: ex.type,
      tip: ex.tip,
      repsTarget: ex.repsTarget,
      isCustom: false,
      sets: makeSets(ex.sets),
    })),
    cardio: { treadmill: { done: false, duration: 15 }, cycling: { done: false, duration: 15 } },
    notes: '',
  };
}

export function newCustomSession(date, label) {
  return {
    id: uid(),
    date: date || today(),
    dayNumber: null,
    dayLabel: label || 'Custom Workout',
    isCustom: true,
    exercises: [],
    cardio: { treadmill: { done: false, duration: 15 }, cycling: { done: false, duration: 15 } },
    notes: '',
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
