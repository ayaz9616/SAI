import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbConnect } from '../../../../lib/db';
import Entry from '../../../../models/Entry';
import { getAuthUserFromCookies } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are Pink Diary Chat, a supportive menstrual health assistant.
Goals: provide empathetic, practical, evidence-informed guidance for menstruation, PMS, pain, mood, flow, cycle irregularities, hygiene, and when to seek care.
Be concise (3–6 short paragraphs or bullet tips). Avoid diagnosis. Encourage professional care for red flags.
Tone: warm, non-judgmental, inclusive.
ALWAYS end with: "This is general guidance, not medical advice."`;

function buildModel(genAI) {
  const cascade = [
    process.env.GEMINI_MODEL?.trim(),
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro'
  ].filter(Boolean);
  return cascade.map(m => genAI.getGenerativeModel({ model: m }));
}

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const { history = [], message = '' } = body;
  const trimmedMsg = String(message || '').slice(0, 2000);

  // Try to attach recent user logs if authenticated
  let logsSummary = '';
  try {
    await dbConnect();
    const user = getAuthUserFromCookies();
    if (user?.id) {
      const raw = await Entry.find({ userId: user.id }).sort({ date: -1 }).limit(20).lean();
      if (raw && raw.length) {
        const lines = raw.map((e) => {
          const d = new Date(e.date).toISOString().slice(0, 10);
          return `${d}: pain=${e.pain}/4, flow=${e.blood}/4, mood=${e.mood}/4`;
        });
        logsSummary = `User recent logs (most recent first):\n${lines.join('\n')}\n\n`;
      }
    }
  } catch (e) {
    // non-fatal; we'll continue without logs
    logsSummary = '';
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = buildModel(genAI);
  const lastTurns = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const prompt = `${SYSTEM_PROMPT}\n\n${logsSummary}Conversation so far:\n${lastTurns}\n\nUser: ${trimmedMsg}\nAssistant:`;

  let lastErr;
  for (const model of models) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return NextResponse.json({ ok: true, model: model.model || 'unknown', reply: text });
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  // Fallback synthesis (no user logs available)
  const userMsg = trimmedMsg.toLowerCase();
  function hint(k, msg) { return userMsg.includes(k) ? (`• ${msg}\n`) : ''; }
  const reply = `I’m here to help with menstrual health. Here are general tips:\n\n${
    hint('cramp', 'Heating pad 15–20 min; gentle stretches (child’s pose, knees-to-chest).') +
    hint('pms', 'Sleep, steady meals, hydration; light movement can ease PMS symptoms.') +
    hint('late', 'Cycle timing can shift due to stress, illness, travel. If >7–10 days late and pregnancy possible, consider testing.') +
    hint('heavy', 'Very heavy = soaking ≥1 pad/tampon per hour for >2h — seek care if this occurs.') +
    hint('mood', 'Track mood vs cycle; seek professional support for severe or persistent mood changes.')
  }• Hydration + balanced meals can help overall.\n• Consider OTC pain relief (if safe for you).\n• Seek medical care for severe pain, very heavy bleeding, fainting, fever, foul discharge, pregnancy concerns, or persistent/worsening symptoms.\n\nThis is general guidance, not medical advice.`;
  return NextResponse.json({ ok: true, fallback: true, error: 'AI unavailable', detail: String(lastErr?.message || lastErr || 'Unknown error'), reply });
}
