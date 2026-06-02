/**
 * usePRs — compute personal records from all logged sessions.
 * Shared between PersonalRecords.vue and LogWorkout.vue.
 */

/**
 * Build a PR map from sessions array.
 * Returns: { [exerciseName]: PREntry }
 */
export function computePRs(sessions) {
  const map = {};

  // Sort oldest-first so history array is chronological
  [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((session) => {
      session.exercises.forEach((ex) => {
        const name = ex.name;
        if (!map[name]) {
          map[name] = {
            name,
            muscle:          ex.muscle || '',
            type:            ex.type   || '',
            bestWeight:      0,
            bestWeightReps:  0,   // reps at best weight
            bestReps:        0,
            bestRepsWeight:  0,   // weight at best reps
            prDate:          null,
            firstDate:       session.date,
            totalSets:       0,
            totalSessions:   0,
            history:         [],  // [{ date, maxWeight, maxReps }]
          };
        }

        const pr = map[name];
        let sessionMaxWeight = 0;
        let sessionMaxReps   = 0;
        let hasValidSet      = false;

        ex.sets.forEach((set) => {
          const reps   = Number(set.reps)   || 0;
          const weight = Number(set.weight) || 0;
          if (!reps) return;

          hasValidSet = true;
          pr.totalSets++;

          sessionMaxWeight = Math.max(sessionMaxWeight, weight);
          sessionMaxReps   = Math.max(sessionMaxReps,   reps);

          // Best weight PR
          if (
            weight > pr.bestWeight ||
            (weight === pr.bestWeight && reps > pr.bestWeightReps)
          ) {
            pr.bestWeight     = weight;
            pr.bestWeightReps = reps;
            pr.prDate         = session.date;
          }

          // Best reps PR
          if (reps > pr.bestReps) {
            pr.bestReps       = reps;
            pr.bestRepsWeight = weight;
          }
        });

        if (hasValidSet) {
          pr.totalSessions++;
          pr.history.push({
            date:      session.date,
            maxWeight: sessionMaxWeight,
            maxReps:   sessionMaxReps,
          });
        }
      });
    });

  return map;
}

/**
 * Check if a given set is a PR compared to existing records.
 * Returns: 'weight' | 'reps' | 'both' | 'first' | null
 */
export function getPRType(exerciseName, weight, reps, prMap) {
  const w = Number(weight) || 0;
  const r = Number(reps)   || 0;
  if (!r) return null;

  const pr = prMap[exerciseName];
  if (!pr || pr.totalSets === 0) return 'first'; // very first log = PR

  const weightPR = w > pr.bestWeight;
  const repsPR   = w > 0 && r > pr.bestReps;

  if (weightPR && repsPR) return 'both';
  if (weightPR)           return 'weight';
  if (r > pr.bestReps)    return 'reps';
  return null;
}

export const PR_LABELS = {
  first:  '🏆 First log!',
  weight: '🏆 PR — best weight!',
  reps:   '🏆 PR — most reps!',
  both:   '🏆 PR — weight & reps!',
};
