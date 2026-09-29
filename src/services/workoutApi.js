export async function analyzeWorkout(session, bodyWeightKg) {
  const exercises = (session.exercises || [])
    .map(ex => ({
      name: ex.name,
      type: ex.type || 'Isolation',
      sets: (ex.sets || [])
        .filter(s => String(s.reps).trim() !== '' && String(s.reps).trim() !== '0')
        .map(s => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
    }))
    .filter(ex => ex.sets.length);

  const cardio = Object.entries(session.cardio || {})
    .filter(([, c]) => c?.done)
    .map(([activity, c]) => ({ activity, minutes: Number(c.duration) || 0 }));

  const resp = await fetch('/api/analyze-workout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ exercises, cardio, bodyWeightKg }),
  });

  let payload;
  try { payload = await resp.json(); }
  catch { throw new Error(`Analyzer returned a non-JSON response (${resp.status})`); }

  if (!resp.ok) throw new Error(payload?.error || `Analyzer failed (${resp.status})`);
  return payload;
}
