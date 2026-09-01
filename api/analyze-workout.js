const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const WORKOUT_SCHEMA = {
  name: 'workout_burn',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      resistanceCalories: { type: 'number' },
      cardioCalories:     { type: 'number' },
      calories:            { type: 'number' },
      notes:               { type: 'string' },
    },
    required: ['resistanceCalories', 'cardioCalories', 'calories', 'notes'],
    additionalProperties: false,
  },
};

const SHAPE_HINT = `Reply with JSON only, in exactly this shape:
{"resistanceCalories":0,"cardioCalories":0,"calories":0,"notes":"string"}`;

const SYSTEM_PROMPT = `You are an exercise physiologist estimating calories burned in a single training session.

You are given the athlete's bodyweight in kg, a list of resistance exercises with the sets actually completed (reps and weight in kg per set), and any cardio performed (activity and duration in minutes).

Rules:
- Estimate calorie burn holistically from training volume (sets x reps x weight), exercise type (compound lifts recruit more muscle mass and burn more than isolation), time under tension including rest between sets, and the athlete's bodyweight — do not apply one fixed MET value to everything.
- For bodyweight or very light resistance exercises, estimate effective intensity from reps and exercise type instead of the raw weight number.
- For cardio, use standard MET values for the named activity, scaled by bodyweight and duration.
- resistanceCalories + cardioCalories MUST equal calories.
- Round all calorie values to whole numbers.
- notes: one short sentence on key assumptions made. Empty string if none.
- If there are no completed sets and no cardio, return all zeros.`;

function describeSession(exercises, cardio, bodyWeightKg) {
  const lines = [`Bodyweight: ${bodyWeightKg} kg`];

  if (exercises.length) {
    lines.push('Resistance exercises:');
    exercises.forEach(ex => {
      const setsDesc = ex.sets.map(s => `${s.reps} reps @ ${s.weight}kg`).join(', ');
      lines.push(`- ${ex.name} (${ex.type}): ${setsDesc}`);
    });
  }

  if (cardio.length) {
    lines.push('Cardio:');
    cardio.forEach(c => lines.push(`- ${c.activity}: ${c.minutes} min`));
  }

  if (!exercises.length && !cardio.length) lines.push('No exercises or cardio logged.');

  return lines.join('\n');
}

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
    max_completion_tokens: 1200,
    response_format: strict
      ? { type: 'json_schema', json_schema: WORKOUT_SCHEMA }
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

  const { exercises, cardio, bodyWeightKg } = await readBody(req);
  const kg = Number(bodyWeightKg);
  if (!Number.isFinite(kg) || kg <= 0) return send(res, 400, { error: 'No valid bodyWeightKg provided' });

  const exList = Array.isArray(exercises) ? exercises : [];
  const cardioList = Array.isArray(cardio) ? cardio : [];

  if (!exList.length && !cardioList.length) {
    return send(res, 200, { resistanceCalories: 0, cardioCalories: 0, calories: 0, notes: 'No sets or cardio logged.', model: GROQ_MODEL });
  }

  const prompt = describeSession(exList, cardioList, kg);

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

  const resistanceCalories = Math.round(num(parsed.resistanceCalories));
  const cardioCalories     = Math.round(num(parsed.cardioCalories));

  // json_object mode isn't schema-bound, so the total can come back missing or
  // inconsistent with the parts. Trust the parts and derive the total from them.
  const calories = resistanceCalories + cardioCalories || Math.round(num(parsed.calories));

  return send(res, 200, {
    resistanceCalories,
    cardioCalories,
    calories,
    notes: String(parsed.notes || ''),
    model: GROQ_MODEL,
  });
}
