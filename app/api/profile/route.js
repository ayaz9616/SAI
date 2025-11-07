import { NextResponse } from 'next/server';
import { dbConnect } from '../../../lib/db';
import User from '../../../models/User';
import { getAuthUserFromCookies } from '../../../lib/auth';

export async function GET(){
  await dbConnect();
  const u = getAuthUserFromCookies();
  if (!u) return NextResponse.json({ user: null });
  const user = await User.findById(u.id).lean();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user._id, email: user.email, cycleDuration: user.cycleDuration, periodDuration: user.periodDuration, name: user.name, avatarUrl: user.avatarUrl } });
}

export async function PUT(req){
  await dbConnect();
  const u = getAuthUserFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { cycleDuration, periodDuration, avatarUrl } = body || {};
  const update = {};
  if (Number.isFinite(cycleDuration)) update.cycleDuration = cycleDuration;
  if (Number.isFinite(periodDuration)) update.periodDuration = periodDuration;
  if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl;
  const user = await User.findByIdAndUpdate(u.id, { $set: update }, { new: true });
  return NextResponse.json({ ok: true, user: { id: user._id, email: user.email, cycleDuration: user.cycleDuration, periodDuration: user.periodDuration, avatarUrl: user.avatarUrl } });
}
