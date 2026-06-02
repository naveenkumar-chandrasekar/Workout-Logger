import * as XLSX from 'xlsx';

/**
 * Export all workout data as a formatted Excel workbook.
 * Sheets: Sessions, Sets, Cardio, Body Weight
 */
export function exportToExcel({ sessions, bodyWeights, dateFrom, dateTo }) {
  const wb = XLSX.utils.book_new();

  const filtered = sessions.filter(s => {
    if (dateFrom && s.date < dateFrom) return false;
    if (dateTo   && s.date > dateTo)   return false;
    return true;
  });

  // ── Sheet 1: Sessions ──────────────────────────────────────────────────
  const sessionRows = filtered.map(s => ({
    'Date':       s.date,
    'Day #':      s.dayNumber || '',
    'Workout':    s.dayLabel,
    'Type':       s.isCustom ? 'Custom' : 'Planned',
    'Exercises':  s.exercises.length,
    'Total Sets': s.exercises.reduce((a, ex) => a + ex.sets.length, 0),
    'Notes':      s.notes || '',
  }));

  // ── Sheet 2: Sets ──────────────────────────────────────────────────────
  const setRows = [];
  filtered.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach((set, i) => {
        setRows.push({
          'Date':     s.date,
          'Workout':  s.dayLabel,
          'Exercise': ex.name,
          'Muscle':   ex.muscle || '',
          'Type':     ex.type || '',
          'Set #':    i + 1,
          'Reps':     set.reps  !== '' ? Number(set.reps)   : '',
          'Weight (kg)': set.weight !== '' ? Number(set.weight) : '',
        });
      });
    });
  });

  // ── Sheet 3: Cardio ────────────────────────────────────────────────────
  const cardioRows = [];
  filtered.forEach(s => {
    const c = s.cardio || {};
    if (c.treadmill?.done || c.jogging?.done || c.cycling?.done) {
      cardioRows.push({
        'Date':              s.date,
        'Workout':           s.dayLabel,
        'Treadmill':         c.treadmill?.done ? 'Yes' : 'No',
        'Treadmill (min)':   c.treadmill?.done ? c.treadmill.duration : '',
        'Jogging':           c.jogging?.done ? 'Yes' : 'No',
        'Jogging (min)':     c.jogging?.done ? c.jogging.duration : '',
        'Cycling':           c.cycling?.done ? 'Yes' : 'No',
        'Cycling (min)':     c.cycling?.done ? c.cycling.duration : '',
      });
    }
  });

  // ── Sheet 4: Body Weight ───────────────────────────────────────────────
  const weightRows = (bodyWeights || [])
    .filter(w => {
      if (dateFrom && w.date < dateFrom) return false;
      if (dateTo   && w.date > dateTo)   return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => ({
      'Date':       w.date,
      'Weight (kg)': w.weight,
      'Note':       w.note || '',
    }));

  // ── Append sheets ──────────────────────────────────────────────────────
  const fallback = row => [row];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionRows.length ? sessionRows : [{ Date:'', 'Day #':'', Workout:'', Type:'', Exercises:'', 'Total Sets':'', Notes:'' }]), 'Sessions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(setRows.length     ? setRows     : [{ Date:'', Workout:'', Exercise:'', Muscle:'', Type:'', 'Set #':'', Reps:'', 'Weight (kg)':'' }]), 'Sets');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cardioRows.length  ? cardioRows  : [{ Date:'', Workout:'', Treadmill:'', 'Treadmill (min)':'', Jogging:'', 'Jogging (min)':'', Cycling:'', 'Cycling (min)':'' }]), 'Cardio');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weightRows.length  ? weightRows  : [{ Date:'', 'Weight (kg)':'', Note:'' }]), 'Body Weight');

  // ── Style header rows (bold) ───────────────────────────────────────────
  ['Sessions','Sets','Cardio','Body Weight'].forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F0EEFF' } } };
    }
  });

  // ── Download ───────────────────────────────────────────────────────────
  const date   = new Date().toISOString().slice(0, 10);
  const suffix = dateFrom || dateTo ? `_${dateFrom || 'start'}_to_${dateTo || 'today'}` : '';
  XLSX.writeFile(wb, `workout_export${suffix}_${date}.xlsx`);
}
