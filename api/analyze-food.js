const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const NUTRITION_SCHEMA = {
  name: 'nutrition_breakdown',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name:     { type: 'string' },
            qty:      { type: 'string' },
            calories: { type: 'number' },
            protein:  { type: 'number' },
            carbs:    { type: 'number' },
            fat:      { type: 'number' },
          },
          required: ['name', 'qty', 'calories', 'protein', 'carbs', 'fat'],
          additionalProperties: false,
        },
      },
      calories: { type: 'number' },
      protein:  { type: 'number' },
      carbs:    { type: 'number' },
      fat:      { type: 'number' },
      notes:    { type: 'string' },
    },
    required: ['items', 'calories', 'protein', 'carbs', 'fat', 'notes'],
    additionalProperties: false,
  },
};

const SHAPE_HINT = `Reply with JSON only, in exactly this shape:
{"items":[{"name":"string","qty":"string","calories":0,"protein":0,"carbs":0,"fat":0}],"calories":0,"protein":0,"carbs":0,"fat":0,"notes":"string"}`;

const SYSTEM_PROMPT = `You are a nutrition estimator. The user describes food they ate in free text, often informally and often Indian or South Indian cuisine.

Break the description into individual food items. For each item estimate calories (kcal) and macros in grams. Then give the totals across all items.

Rules:
- If a quantity is not stated, assume one standard household serving and say so in notes.
- Interpret common Indian units literally: 1 chapati/roti ~ 70-90 kcal, 1 idli ~ 60-70 kcal, 1 dosa ~ 130-170 kcal, 1 cup cooked rice ~ 200 kcal, 1 cup dal ~ 180 kcal, 1 cup curd ~ 100 kcal.
- Account for visible cooking fat in fried or tempered dishes.
- calories, protein, carbs and fat at the top level MUST equal the sum of the items.
- Round calories to whole numbers and macros to one decimal place.
- notes: one short sentence listing the assumptions you made. Empty string if none.
- If the text describes no food at all, return zero totals, an empty items array, and say so in notes.`;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function callGroq(apiKey, text, strict) {
  const body = {
    model: GROQ_MODEL,
    temperature: 0.2,
    // Groq reserves this against the tokens-per-minute quota whether it is used
    // or not, so it has to stay well under the 8K TPM free-tier cap — the prompt
    // and a possible fallback retry share the same budget.
    max_completion_tokens: 2000,
    response_format: strict
      ? { type: 'json_schema', json_schema: NUTRITION_SCHEMA }
      : { type: 'json_object' },
    messages: [
      { role: 'system', content: strict ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\n${SHAPE_HINT}` },
      { role: 'user',   content: text },
    ],
  };

  // gpt-oss reasoning tokens are billed against max_completion_tokens; keep them short
  // or the model runs out of budget mid-JSON and Groq rejects the generation.
  if (GROQ_MODEL.startsWith('openai/gpt-oss')) body.reasoning_effort = 'low';

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await resp.text();
  return { ok: resp.ok, status: resp.status, raw };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return send(res, 500, { error: 'GROQ_API_KEY is not configured on the server' });

  const { text } = await readBody(req);
  if (!text || !String(text).trim()) return send(res, 400, { error: 'No food description provided' });

  const prompt = String(text).trim();

  let attempt;
  try {
    attempt = await callGroq(apiKey, prompt, true);
    // Constrained decoding can still fail to close the JSON in budget; json_object
    // mode is looser and almost always lands, so fall back rather than erroring out.
    if (!attempt.ok && attempt.raw.includes('json_validate_failed')) {
      attempt = await callGroq(apiKey, prompt, false);
    }
  } catch (e) {
    return send(res, 502, { error: `Could not reach Groq: ${e.message}` });
  }

  if (!attempt.ok) {
    if (attempt.raw.includes('rate_limit_exceeded')) {
      return send(res, 429, { error: 'Groq rate limit reached — wait about a minute and try again.' });
    }
    return send(res, attempt.status, { error: `Groq error ${attempt.status}: ${attempt.raw.slice(0, 400)}` });
  }

  let content;
  try { content = JSON.parse(attempt.raw)?.choices?.[0]?.message?.content; }
  catch { return send(res, 502, { error: 'Groq returned an unreadable response' }); }
  if (!content) return send(res, 502, { error: 'Groq returned an empty response' });

  let parsed;
  try { parsed = JSON.parse(content); }
  catch { return send(res, 502, { error: 'Groq returned malformed JSON' }); }

  const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const items = (Array.isArray(parsed.items) ? parsed.items : []).map(i => ({
    name:     String(i.name || ''),
    qty:      String(i.qty  || ''),
    calories: Math.round(num(i.calories)),
    protein:  +num(i.protein).toFixed(1),
    carbs:    +num(i.carbs).toFixed(1),
    fat:      +num(i.fat).toFixed(1),
  }));

  // json_object mode isn't schema-bound, so totals can come back missing or
  // inconsistent with the items. Trust the items and derive the totals from them.
  const sum = key => items.reduce((a, i) => a + i[key], 0);
  const total = key => (items.length ? sum(key) : num(parsed[key]));

  return send(res, 200, {
    calories: Math.round(total('calories')),
    protein:  +total('protein').toFixed(1),
    carbs:    +total('carbs').toFixed(1),
    fat:      +total('fat').toFixed(1),
    notes:    String(parsed.notes || ''),
    model:    GROQ_MODEL,
    items,
  });
}
