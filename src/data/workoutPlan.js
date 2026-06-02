export const DEFAULT_PLAN = {
  1: {
    label: 'Chest · Shoulder · Triceps',
    color: '#6c5ce7',
    muscles: ['Chest', 'Shoulder', 'Triceps'],
    coachTip: 'Start with compound presses while fresh. Rest 90 sec between compound sets, 60 sec on isolation.',
    exercises: [
      { name: 'Flat Bench Press',      muscle: 'Chest',    sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '45–60 kg · controlled descent · retract scapula' },
      { name: 'Neutral Bench Press',   muscle: 'Chest',    sets: 3, repsTarget: '10',   type: 'Isolation', tip: 'Neutral grip · feel the stretch at bottom' },
      { name: 'Shoulder Press',        muscle: 'Shoulder', sets: 4, repsTarget: '10',   type: 'Compound',  tip: "30–40 kg · don't lock out fully at top" },
      { name: 'Reverse Flyes',         muscle: 'Shoulder', sets: 3, repsTarget: '12-15',type: 'Isolation', tip: 'Light weight · squeeze rear delts at top' },
      { name: 'Cable Pushdown',        muscle: 'Triceps',  sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Keep elbows pinned tight to sides' },
      { name: 'DB Overhead Extension', muscle: 'Triceps',  sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Single dumbbell · full range of motion' },
    ],
  },
  2: {
    label: 'Back · Biceps · Legs',
    color: '#00b894',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Do heavy rows and squats first. Rest 90–120 sec for compounds, 60 sec for arms.',
    exercises: [
      { name: 'Front Pulldown',  muscle: 'Back',   sets: 4, repsTarget: '10',   type: 'Compound',  tip: 'Wide grip · pull bar to upper chest' },
      { name: 'T-Bar Row',       muscle: 'Back',   sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '50–70 kg · hinge at hips · neutral spine' },
      { name: 'Front Pull-Up',   muscle: 'Back',   sets: 3, repsTarget: 'max',  type: 'Compound',  tip: 'Bodyweight or assisted · full hang at bottom' },
      { name: 'Barbell Curl',    muscle: 'Biceps', sets: 3, repsTarget: '10',   type: 'Isolation', tip: '20–25 kg · strict form · no swinging' },
      { name: 'DB Hammer Curl',  muscle: 'Biceps', sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Neutral grip · slow eccentric · brachialis focus' },
      { name: 'Free Squat',      muscle: 'Legs',   sets: 4, repsTarget: '10',   type: 'Compound',  tip: '50–60 kg · depth below parallel · brace core' },
      { name: 'Machine Squat',   muscle: 'Legs',   sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Higher rep finish to pump quads' },
    ],
  },
  3: {
    label: 'Chest · Shoulder · Biceps · Triceps',
    color: '#e17055',
    muscles: ['Chest', 'Shoulder', 'Biceps', 'Triceps'],
    coachTip: 'Arnold Press replaces Upright Row to avoid overlap with Day 1 shoulder pressing.',
    exercises: [
      { name: 'Incline Chest Press',   muscle: 'Chest',    sets: 4, repsTarget: '10', type: 'Compound',  tip: '30–40° incline · targets upper chest' },
      { name: 'Bench Bend Arm Curl',   muscle: 'Biceps',   sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Full stretch at bottom of each rep' },
      { name: 'Arnold Press',          muscle: 'Shoulder', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Full delt rotation · 12–16 kg DBs' },
      { name: 'Lateral Raise',         muscle: 'Shoulder', sets: 3, repsTarget: '15', type: 'Isolation', tip: '8–10 kg · slight bend in elbow · thumbs neutral' },
      { name: 'Skull Crusher',         muscle: 'Triceps',  sets: 3, repsTarget: '12', type: 'Isolation', tip: 'EZ bar 20–25 kg · lower bar to forehead' },
      { name: 'DB Kickback',           muscle: 'Triceps',  sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Squeeze hard at full extension' },
    ],
  },
  4: {
    label: 'Back · Biceps · Legs',
    color: '#0984e3',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Complement to Day 2 with different angles. Close-grip pulldown hits lats differently from wide grip.',
    exercises: [
      { name: 'Close-Grip Pulldown', muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: 'V-bar · elbows drive straight down' },
      { name: 'Seated Row',          muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: "Retract scapula fully · don't round back" },
      { name: 'Preacher Curl',       muscle: 'Biceps', sets: 3, repsTarget: '10', type: 'Isolation', tip: 'Full stretch at bottom · strict form' },
      { name: 'DB Alternate Curl',   muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Supinate wrist at top of each rep' },
      { name: 'Leg Extension',       muscle: 'Legs',   sets: 3, repsTarget: '15', type: 'Isolation', tip: 'Quad isolation · squeeze hard at top' },
      { name: 'Leg Press',           muscle: 'Legs',   sets: 4, repsTarget: '12', type: 'Compound',  tip: '80–100 kg · feet shoulder-width' },
    ],
  },
  5: {
    label: 'Chest · Shoulder · Triceps',
    color: '#a29bfe',
    muscles: ['Chest', 'Shoulder', 'Triceps'],
    coachTip: 'Face pulls protect shoulder health — never skip. High Extension complements Day 1 Cable Pushdown.',
    exercises: [
      { name: 'Decline Press',    muscle: 'Chest',    sets: 4, repsTarget: '10',  type: 'Compound',  tip: 'Targets lower chest · keep elbows at 75°' },
      { name: 'Chest Flyes',      muscle: 'Chest',    sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Dumbbells or cables · full arc · slight bend' },
      { name: 'Face Pull',        muscle: 'Shoulder', sets: 3, repsTarget: '15',  type: 'Isolation', tip: 'Rope · pull to forehead · external rotation' },
      { name: 'Front Raise',      muscle: 'Shoulder', sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Alternating · 8–10 kg · slow and controlled' },
      { name: 'High Extension',   muscle: 'Triceps',  sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Cable overhead · elbows close · long head focus' },
      { name: 'Dips',             muscle: 'Triceps',  sets: 3, repsTarget: 'max', type: 'Compound',  tip: 'Bodyweight or weighted · slight forward lean' },
    ],
  },
  6: {
    label: 'Back · Biceps · Legs',
    color: '#00cec9',
    muscles: ['Back', 'Biceps', 'Legs'],
    coachTip: 'Straight-Arm Pulldown replaces Back Pulldown — avoids a third lat pulldown variation across the week.',
    exercises: [
      { name: 'Straight-Arm Pulldown', muscle: 'Back',   sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Cable · different lat movement pattern' },
      { name: 'Dumbbell Row',          muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: '25–35 kg single arm · elbow past torso' },
      { name: 'Overhead Cable Curl',   muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Cable at head height · long head bicep focus' },
      { name: 'Concentration Curl',    muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Slow and deliberate · peak contraction' },
      { name: 'Leg Curl',              muscle: 'Legs',   sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Hamstring isolation · full range of motion' },
      { name: 'Calf Raises',           muscle: 'Legs',   sets: 3, repsTarget: '20', type: 'Isolation', tip: 'Slow tempo · pause at top and bottom' },
    ],
  },
};

// Colour map for muscle tags
export const MUSCLE_COLORS = {
  Chest:    { bg: '#fff0f6', color: '#c0256f', border: '#fbb6ce' },
  Shoulder: { bg: '#f0f4ff', color: '#3451b2', border: '#b5c7f7' },
  Triceps:  { bg: '#f3f0ff', color: '#6741d9', border: '#c5b8fb' },
  Back:     { bg: '#edfcf2', color: '#1a7f4b', border: '#93e6b3' },
  Biceps:   { bg: '#fff8e6', color: '#b45309', border: '#fcd57a' },
  Legs:     { bg: '#fef3ea', color: '#c2410c', border: '#fdb98a' },
};

export function muscleStyle(muscle) {
  return MUSCLE_COLORS[muscle] || { bg: '#f4f5f9', color: '#6b7280', border: '#e5e7ef' };
}

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
      muscle: ex.muscle || '',
      type: ex.type,
      tip: ex.tip,
      repsTarget: ex.repsTarget,
      isCustom: false,
      sets: makeSets(ex.sets),
    })),
    cardio: { treadmill: { done: false, duration: 15 }, jogging: { done: false, duration: 20 }, cycling: { done: false, duration: 15 } },
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
    cardio: { treadmill: { done: false, duration: 15 }, jogging: { done: false, duration: 20 }, cycling: { done: false, duration: 15 } },
    notes: '',
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
