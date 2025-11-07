export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/db';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const { email, password, name, age, heightCm, weightKg, firstPeriodAge, primaryConcern, cycleDuration, periodDuration } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  const existing = await User.findOne({ email });
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const numeric = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
  const user = await User.create({
    email,
    passwordHash,
    name,
    age: numeric(age),
    heightCm: numeric(heightCm),
    weightKg: numeric(weightKg),
    firstPeriodAge: numeric(firstPeriodAge),
    primaryConcern: (primaryConcern || '').slice(0,300),
    cycleDuration: numeric(cycleDuration) ?? 30,
    periodDuration: numeric(periodDuration) ?? 5,
  });
  return NextResponse.json({ ok: true, user: { id: user._id, email: user.email, name: user.name } });
}
