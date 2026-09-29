const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// The LLM only judges intensity (MET) per item — it never touches the final
// arithmetic. Letting a model output the finished calorie number directly is
// unreliable: it isn't computing anything, it's pattern-matching to a
// plausible-sounding figure, so identical input can swing wildly between
// calls (e.g. 122 vs 852 kcal for the same session). MET is a well-known,
// bounded quantity models can classify consistently; the kcal = MET x 3.5 x
// kg / 200 x minutes conversion is done here in JS so it's exact and
// reproducible every time.
const MINUTES_PER_SET = 1;
const RESISTANCE_MET_RANGE   = [2, 10];
const CARDIO_MET_RANGE       = [2, 14];
const DEFAULT_RESISTANCE_MET = 5;
const DEFAULT_CARDIO_MET     = 6;

function metKcal(met, kg, minutes) {
  return (met * 3.5 * kg) / 200 * minutes;
}

function clamp(value, [lo, hi], fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

const MET_SCHEMA = {
  name: 'workout_mets',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            met:  { type: 'number' },
          },
          required: ['name', 'met'],
          additionalProperties: false,
        },
      },
      cardio: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            activity: { type: 'string' },
            met:      { type: 'number' },
          },
          required: ['activity', 'met'],
          additionalProperties: false,
        },
      },
      notes: { type: 'string' },
    },
    required: ['exercises', 'cardio', 'notes'],
    additionalProperties: false,
  },
};

const SHAPE_HINT = `Reply with JSON only, in exactly this shape:
{"exercises":[{"name":"string","met":0}],"cardio":[{"activity":"string","met":0}],"notes":"string"}`;

const SYSTEM_PROMPT = `You are an exercise physiologist. You are given an athlete's bodyweight and a list of resistance exercises and cardio activities from one training session.

Your ONLY job is to assign each item a MET (Metabolic Equivalent of Task) value from the Compendium of Physical Activities. Do NOT compute calories, durations, or totals — the server does that arithmetic deterministically from the MET value you return, so it must be your honest intensity judgment, not a placeholder.

Rules:
- Resistance exercise MET roughly: 3-4 for light machine/isolation work, 4-6 for moderate free-weight isolation or light compound work, 6-8 for heavy compound free-weight lifting (squat, deadlift, bench, row) at a load that is challenging for that athlete's bodyweight.
- Judge "heavy" relative to the athlete's own bodyweight and the reps performed — the same absolute kg is harder for a lighter athlete, or at low reps near failure, than for a heavier athlete at high reps.
- Compound, multi-joint movements get a higher MET than isolation movements at similar relative load.
- Cardio MET follows standard Compendium values for the named activity (e.g. treadmill jogging ~9-11, brisk walking ~3.5-5, moderate stationary cycling ~7, vigorous cycling ~10-12).
- Return exactly one entry per exercise name and per cardio activity given, using the exact same name/activity string you were given.
- notes: one short sentence on key assumptions made. Empty string if none.`;

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
    // Classification, not generation — zero temperature for the most
    // reproducible MET judgment the model can give.
    temperature: 0,
    // Groq reserves this against the tokens-per-minute quota whether it is used
    // or not, so it has to stay well under the 8K TPM free-tier cap — the prompt
    // and a possible fallback retry share the same budget.
    max_completion_tokens: 900,
    response_format: strict
      ? { type: 'json_schema', json_schema: MET_SCHEMA }
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

  const metByExercise = new Map((Array.isArray(parsed.exercises) ? parsed.exercises : []).map(e => [e.name, e.met]));
  const metByCardio   = new Map((Array.isArray(parsed.cardio)    ? parsed.cardio    : []).map(c => [c.activity, c.met]));

  const resistanceCalories = Math.round(exList.reduce((a, ex) => {
    const met     = clamp(metByExercise.get(ex.name), RESISTANCE_MET_RANGE, DEFAULT_RESISTANCE_MET);
    const minutes = ex.sets.length * MINUTES_PER_SET;
    return a + metKcal(met, kg, minutes);
  }, 0));

  const cardioCalories = Math.round(cardioList.reduce((a, c) => {
    const met = clamp(metByCardio.get(c.activity), CARDIO_MET_RANGE, DEFAULT_CARDIO_MET);
    return a + metKcal(met, kg, c.minutes);
  }, 0));

  return send(res, 200, {
    resistanceCalories,
    cardioCalories,
    calories: resistanceCalories + cardioCalories,
    notes: String(parsed.notes || ''),
    model: GROQ_MODEL,
  });
}
