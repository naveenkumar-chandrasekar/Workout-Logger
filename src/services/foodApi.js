export async function analyzeFood(text) {
  const resp = await fetch('/api/analyze-food', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  let payload;
  try { payload = await resp.json(); }
  catch { throw new Error(`Analyzer returned a non-JSON response (${resp.status})`); }

  if (!resp.ok) throw new Error(payload?.error || `Analyzer failed (${resp.status})`);
  return payload;
}
