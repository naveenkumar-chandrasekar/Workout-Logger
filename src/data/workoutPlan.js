export const DEFAULT_PLAN = {
  1: {
    label: 'Chest · Shoulder · Triceps',
    color: '#6c5ce7',
    muscles: ['Core', 'Chest', 'Shoulder', 'Triceps', 'Abs'],
    coachTip: 'Push Up + Pull Up first, then heavy flat bench and shoulder press. Rest 90 sec on compounds, 60 sec on isolation. Finish with abs.',
    exercises: [
      { name: 'Push Up',  muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up',  muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Flat Bench Press',      muscle: 'Chest',    sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '45–60 kg · controlled descent · retract scapula' },
      { name: 'Chest Flyes',           muscle: 'Chest',    sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Dumbbells or cables · full arc · slight bend' },
      { name: 'Shoulder Press',        muscle: 'Shoulder', sets: 4, repsTarget: '10',   type: 'Compound',  tip: "30–40 kg · don't lock out fully at top" },
      { name: 'Lateral Raise',         muscle: 'Shoulder', sets: 3, repsTarget: '15',   type: 'Isolation', tip: '8–10 kg · slight bend in elbow · thumbs neutral' },
      { name: 'Cable Pushdown',        muscle: 'Triceps',  sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Keep elbows pinned tight to sides' },
      { name: 'DB Overhead Extension', muscle: 'Triceps',  sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Single dumbbell · full range of motion' },
      { name: 'Crunch',                muscle: 'Abs',      sets: 3, repsTarget: '20',   type: 'Isolation', tip: 'Lower back on floor · lift shoulder blades · exhale up' },
      { name: 'Lying Leg Raise',       muscle: 'Abs',      sets: 3, repsTarget: '15',   type: 'Isolation', tip: 'Hands under hips · legs straight · lower slowly' },
      { name: 'Bicycle Crunch',        muscle: 'Abs',      sets: 3, repsTarget: '20',   type: 'Isolation', tip: 'Elbow to opposite knee · rotate from the torso' },
    ],
  },
  2: {
    label: 'Back · Biceps · Legs',
    color: '#00b894',
    muscles: ['Core', 'Back', 'Biceps', 'Legs', 'Abs'],
    coachTip: 'Push Up + Pull Up first. Do heavy rows and squats with full focus. Rest 90–120 sec for compounds, 60 sec for arms. Finish with abs.',
    exercises: [
      { name: 'Push Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Front Pulldown',   muscle: 'Back',   sets: 4, repsTarget: '10',   type: 'Compound',  tip: 'Wide grip · pull bar to upper chest' },
      { name: 'T-Bar Row',        muscle: 'Back',   sets: 4, repsTarget: '8-10', type: 'Compound',  tip: '50–70 kg · hinge at hips · neutral spine' },
      { name: 'Barbell Curl',     muscle: 'Biceps', sets: 3, repsTarget: '10',   type: 'Isolation', tip: '20–25 kg · strict form · no swinging' },
      { name: 'DB Hammer Curl',   muscle: 'Biceps', sets: 3, repsTarget: '12',   type: 'Isolation', tip: 'Neutral grip · slow eccentric · brachialis focus' },
      { name: 'Free Squat',       muscle: 'Legs',   sets: 4, repsTarget: '10',   type: 'Compound',  tip: '50–60 kg · depth below parallel · brace core' },
      { name: 'Leg Extension',    muscle: 'Legs',   sets: 3, repsTarget: '15',   type: 'Isolation', tip: 'Quad isolation · squeeze hard at top' },
      { name: 'Sit-Up',           muscle: 'Abs',    sets: 3, repsTarget: '15',   type: 'Isolation', tip: 'Feet anchored · controlled up and down · no neck pulling' },
      { name: 'Seated Knee Tuck', muscle: 'Abs',    sets: 3, repsTarget: '15',   type: 'Isolation', tip: 'Lean back on hands · pull knees to chest · extend fully' },
      { name: 'Plank',            muscle: 'Abs',    sets: 3, repsTarget: '45-60 sec', type: 'Isolation', tip: 'Elbows under shoulders · straight line head to heels' },
    ],
  },
  3: {
    label: 'Chest · Shoulder · Triceps',
    color: '#e17055',
    muscles: ['Core', 'Chest', 'Shoulder', 'Triceps', 'Abs'],
    coachTip: 'Push Up + Pull Up first. Upper-chest focus with incline and neutral presses; Arnold Press hits all three delt heads. Finish with abs.',
    exercises: [
      { name: 'Push Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Incline Chest Press', muscle: 'Chest',    sets: 4, repsTarget: '10',    type: 'Compound',  tip: '30–40° incline · targets upper chest' },
      { name: 'Neutral Bench Press', muscle: 'Chest',    sets: 3, repsTarget: '10',    type: 'Isolation', tip: 'Neutral grip · feel the stretch at bottom' },
      { name: 'Arnold Press',        muscle: 'Shoulder', sets: 3, repsTarget: '12',    type: 'Isolation', tip: 'Full delt rotation · 12–16 kg DBs' },
      { name: 'Reverse Flyes',       muscle: 'Shoulder', sets: 3, repsTarget: '12-15', type: 'Isolation', tip: 'Light weight · squeeze rear delts at top' },
      { name: 'Skull Crusher',       muscle: 'Triceps',  sets: 3, repsTarget: '12',    type: 'Isolation', tip: 'EZ bar 20–25 kg · lower bar to forehead' },
      { name: 'DB Kickback',         muscle: 'Triceps',  sets: 3, repsTarget: '12',    type: 'Isolation', tip: 'Squeeze hard at full extension' },
      { name: 'Toe-Touch Crunch',    muscle: 'Abs',      sets: 3, repsTarget: '15',    type: 'Isolation', tip: 'Legs vertical · reach hands to toes · lift shoulder blades' },
      { name: 'Reverse Crunch',      muscle: 'Abs',      sets: 3, repsTarget: '15',    type: 'Isolation', tip: 'Curl hips off floor · no swinging · lower slowly' },
      { name: 'Russian Twist',       muscle: 'Abs',      sets: 3, repsTarget: '20',    type: 'Isolation', tip: 'Lean back 45° · rotate shoulders side to side' },
    ],
  },
  4: {
    label: 'Back · Biceps · Legs',
    color: '#0984e3',
    muscles: ['Core', 'Back', 'Biceps', 'Legs', 'Abs'],
    coachTip: 'Push Up + Pull Up first. Close-grip pulldown hits lats differently from wide grip; Leg Curl covers hamstrings this week. Finish with abs.',
    exercises: [
      { name: 'Push Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Close-Grip Pulldown', muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: 'V-bar · elbows drive straight down' },
      { name: 'Seated Row',          muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: "Retract scapula fully · don't round back" },
      { name: 'Preacher Curl',       muscle: 'Biceps', sets: 3, repsTarget: '10', type: 'Isolation', tip: 'Full stretch at bottom · strict form' },
      { name: 'DB Alternate Curl',   muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Supinate wrist at top of each rep' },
      { name: 'Leg Press',           muscle: 'Legs',   sets: 4, repsTarget: '12', type: 'Compound',  tip: '80–100 kg · feet shoulder-width' },
      { name: 'Leg Curl',            muscle: 'Legs',   sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Hamstring isolation · full range of motion' },
      { name: 'Jackknife',           muscle: 'Abs',    sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Lift arms and legs together · meet in the middle' },
      { name: 'Scissor Kicks',       muscle: 'Abs',    sets: 3, repsTarget: '30 sec', type: 'Isolation', tip: 'Lower back pressed down · small fast crosses' },
      { name: 'Side Plank',          muscle: 'Abs',    sets: 3, repsTarget: '30 sec / side', type: 'Isolation', tip: 'Elbow under shoulder · hips high · no sagging' },
    ],
  },
  5: {
    label: 'Chest · Shoulder · Triceps',
    color: '#a29bfe',
    muscles: ['Core', 'Chest', 'Shoulder', 'Triceps', 'Abs'],
    coachTip: 'Push Up + Pull Up first. Lower-chest focus with decline press and pullover. Face pulls protect shoulder health — never skip. Finish with abs.',
    exercises: [
      { name: 'Push Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Decline Press',     muscle: 'Chest',    sets: 4, repsTarget: '10',  type: 'Compound',  tip: 'Targets lower chest · keep elbows at 75°' },
      { name: 'Bent-Arm Pullover', muscle: 'Chest',    sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Single DB · elbows slightly bent · full stretch behind head' },
      { name: 'Front Raise',       muscle: 'Shoulder', sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Alternating · 8–10 kg · slow and controlled' },
      { name: 'Face Pull',         muscle: 'Shoulder', sets: 3, repsTarget: '15',  type: 'Isolation', tip: 'Rope · pull to forehead · external rotation' },
      { name: 'High Extension',    muscle: 'Triceps',  sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Cable overhead · elbows close · long head focus' },
      { name: 'Dips',              muscle: 'Triceps',  sets: 3, repsTarget: 'max', type: 'Compound',  tip: 'Bodyweight or weighted · slight forward lean' },
      { name: 'V-Up',              muscle: 'Abs',      sets: 3, repsTarget: '12',  type: 'Isolation', tip: 'Arms and legs straight · touch toes at the top' },
      { name: 'Flutter Kicks',     muscle: 'Abs',      sets: 3, repsTarget: '30 sec', type: 'Isolation', tip: 'Legs low · small alternating kicks · lower back down' },
      { name: 'Heel Taps',         muscle: 'Abs',      sets: 3, repsTarget: '20',  type: 'Isolation', tip: 'Knees bent · shoulders up · reach side to side' },
    ],
  },
  6: {
    label: 'Back · Biceps · Legs',
    color: '#00cec9',
    muscles: ['Core', 'Back', 'Biceps', 'Legs', 'Abs'],
    coachTip: 'Push Up + Pull Up first. Straight-Arm Pulldown isolates lats before heavy rows; long-head curl focus; finish legs with calves. Finish with abs.',
    exercises: [
      { name: 'Push Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Full range · chest to floor · keep core tight' },
      { name: 'Pull Up', muscle: 'Core', sets: 4, repsTarget: 'max', type: 'Compound', tip: 'Dead hang start · chin over bar · control descent' },
      { name: 'Straight-Arm Pulldown', muscle: 'Back',   sets: 4, repsTarget: '12', type: 'Compound',  tip: 'Cable · different lat movement pattern' },
      { name: 'Dumbbell Row',          muscle: 'Back',   sets: 4, repsTarget: '10', type: 'Compound',  tip: '25–35 kg single arm · elbow past torso' },
      { name: 'Overhead Cable Curl',   muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Cable at head height · long head bicep focus' },
      { name: 'Concentration Curl',    muscle: 'Biceps', sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Slow and deliberate · peak contraction' },
      { name: 'Machine Squat',         muscle: 'Legs',   sets: 3, repsTarget: '12', type: 'Isolation', tip: 'Higher rep finish to pump quads' },
      { name: 'Calf Raises',           muscle: 'Legs',   sets: 3, repsTarget: '20', type: 'Isolation', tip: 'Slow tempo · pause at top and bottom' },
      { name: 'Butterfly Sit-Up',      muscle: 'Abs',    sets: 3, repsTarget: '15', type: 'Isolation', tip: 'Soles together · knees out · reach hands past feet' },
      { name: 'Leg Raise Hold',        muscle: 'Abs',    sets: 3, repsTarget: '30 sec', type: 'Isolation', tip: 'Legs straight · 6 inches off floor · lower back down' },
      { name: 'Dead Bug',              muscle: 'Abs',    sets: 3, repsTarget: '10 / side', type: 'Isolation', tip: 'Opposite arm and leg · lower back glued to floor' },
    ],
  },
};

// Colour map for muscle tags
export const MUSCLE_COLORS = {
  Core:     { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Chest:    { bg: '#fff0f6', color: '#c0256f', border: '#fbb6ce' },
  Shoulder: { bg: '#f0f4ff', color: '#3451b2', border: '#b5c7f7' },
  Triceps:  { bg: '#f3f0ff', color: '#6741d9', border: '#c5b8fb' },
  Back:     { bg: '#edfcf2', color: '#1a7f4b', border: '#93e6b3' },
  Biceps:   { bg: '#fff8e6', color: '#b45309', border: '#fcd57a' },
  Legs:     { bg: '#fef3ea', color: '#c2410c', border: '#fdb98a' },
  Abs:      { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
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
