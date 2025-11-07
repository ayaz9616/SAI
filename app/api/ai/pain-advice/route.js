import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Force Node.js runtime & dynamic to avoid static caching issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Extract first valid JSON object from arbitrary text (handles fenced code / prose)
function extractJson(text) {
  if (!text) return null;
  // Remove common fences
  let cleaned = text.replace(/```json|```/gi, '').trim();
  // Direct parse attempt
  try { return JSON.parse(cleaned); } catch {}
  // Regex find first { ... }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

async function generateAdvice({ apiKey, pain, blood, symptomsText }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Allow override via env, then try a cascade of known model ids
  const candidates = [
    process.env.GEMINI_MODEL?.trim(),
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
  ].filter(Boolean);
  const prompt = `You are a menstrual health assistant. Given inputs pain (0-4), blood (0-4), and a short free text, produce ONLY valid JSON with this shape (no commentary):\n{\n  "severity": 0-100,\n  "summary": string,\n  "steps": [{ "title": string, "detail": string }],\n  "whenToSeekCare": string\n}\nKeep it supportive, non-diagnostic, practical. Inputs: pain=${pain}, blood=${blood}, text="${symptomsText}".`;

  let lastError;
  for (const m of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = extractJson(text);
      if (data && typeof data === 'object') {
        return { data, model: m };
      }
      lastError = new Error('Invalid JSON response');
    } catch (err) {
      lastError = err;
      continue; // try next model
    }
  }
  throw lastError || new Error('AI model generation failed');
}

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  let pain = 0, blood = 0, symptomsText = '', extra = {};
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  pain = Number(body.pain ?? 0);
  blood = Number(body.blood ?? 0);
  symptomsText = String(body.symptomsText ?? '');
  extra = body.extra ?? {};

  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  try {
    const { data, model } = await generateAdvice({ apiKey, pain, blood, symptomsText });
    return NextResponse.json({ ok: true, model, advice: data });
  } catch (e) {
    // Fallback synthesis (no external call)
    try {
      const severityBase = Math.min(100, Math.max(0, pain * 22 + blood * 18));
      const severeFlags = /faint|fever|infection|pregnan|clot|dizzy|black out|unbearable/i.test(symptomsText);
      const severity = Math.min(100, severityBase + (severeFlags ? 15 : 0));

      // Pool of general self-care tips (20+). We’ll pick 5 at random when AI is unavailable.
      const advicePool = [
        { title: 'Heat therapy', detail: 'Use a heating pad or warm towel on the lower abdomen for 15–20 minutes.' },
        { title: 'Gentle stretches', detail: 'Try child’s pose, knees‑to‑chest, or cat‑cow for a few minutes.' },
        { title: 'Short walk', detail: 'A 5–10 minute light walk can improve circulation and ease cramps.' },
        { title: 'Breathing exercises', detail: 'Practice slow diaphragmatic breathing for 3–5 minutes to relax muscles.' },
        { title: 'Hydration', detail: 'Sip water or ginger/peppermint tea to reduce bloating and nausea.' },
        { title: 'Balanced snacks', detail: 'Opt for small, steady meals with protein and complex carbs.' },
        { title: 'OTC option (if safe)', detail: 'NSAIDs like ibuprofen with food may help—avoid if contraindicated.' },
        { title: 'Warm shower or bath', detail: 'Warm water relaxes uterine muscles and may reduce pain.' },
        { title: 'Magnesium intake', detail: 'Foods like nuts, beans, and leafy greens support muscle relaxation.' },
        { title: 'Limit caffeine', detail: 'High caffeine can worsen cramps for some—consider reducing intake.' },
        { title: 'Light massage', detail: 'Gentle circular massage on the lower abdomen for a few minutes.' },
        { title: 'TENS (if available)', detail: 'A low‑setting TENS unit can help some people with cramps.' },
        { title: 'Sleep routine', detail: 'Aim for consistent sleep; rest can lower pain sensitivity.' },
        { title: 'Posture breaks', detail: 'Stand and stretch briefly each hour if seated for long periods.' },
        { title: 'Track triggers', detail: 'Note foods or activities that seem to worsen symptoms for you.' },
        { title: 'Iron‑rich foods', detail: 'Include lentils, spinach, or fortified cereals—especially with heavier flow.' },
        { title: 'Warm fluids', detail: 'Warm soups/teas can soothe and keep you hydrated.' },
        { title: 'Mindfulness minute', detail: '1–2 minutes of mindful focus can reduce stress and tension.' },
        { title: 'Period underwear/pads', detail: 'Choose comfortable protection to reduce friction/irritation.' },
        { title: 'Plan gentle pace', detail: 'If possible, lighten your schedule and take brief rest breaks.' },
        { title: 'Reduce alcohol/smoking', detail: 'These can worsen inflammation and discomfort for some.' },
        { title: 'Nausea relief', detail: 'Bland foods (toast/crackers) and ginger can help settle the stomach.' },
      ];

      // Randomly select 5 unique tips
      const indices = new Set();
      while (indices.size < 5 && indices.size < advicePool.length) {
        indices.add(Math.floor(Math.random() * advicePool.length));
      }
      const steps = Array.from(indices).map(i => advicePool[i]);

      const whenToSeekCare = 'Seek medical advice for very heavy bleeding (soaking ≥1 pad/tampon per hour >2h), severe or escalating pain, fever, foul discharge, fainting, pregnancy concerns, or persistent/worsening symptoms.';
      const summary = `AI is currently unavailable. Here are 5 general self‑care tips you can try. This is general guidance, not medical advice.`;
      return NextResponse.json({ ok: true, fallback: true, error: 'AI unavailable', detail: String(e?.message || e), advice: { severity, summary, steps, whenToSeekCare } });
    } catch (inner) {
      return NextResponse.json({ error: 'AI request failed', detail: String(inner?.stack || inner) }, { status: 500 });
    }
  }
}
