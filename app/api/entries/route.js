import { NextResponse } from 'next/server';
import { dbConnect } from '../../../lib/db';
import Entry from '../../../models/Entry';
import User from '../../../models/User';
import { getAuthUserFromCookies } from '../../../lib/auth';

export async function GET(req) {
  await dbConnect();
  const user = getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const entries = await Entry.find({ userId: user.id }).lean();
  const profile = await User.findById(user.id).lean();
  return NextResponse.json({ entries, settings: { cycleDuration: profile?.cycleDuration || 30, periodDuration: profile?.periodDuration || 5 } });
}

export async function POST(req) {
  await dbConnect();
  const user = getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { date, blood = 0, mood = 0, pain = 0, sex = 0, notes = '' } = await req.json();
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  const doc = await Entry.findOneAndUpdate(
    { userId: user.id, date: new Date(date) },
    { $set: { blood, mood, pain, sex, notes } },
    { new: true, upsert: true }
  );
  return NextResponse.json({ ok: true, entry: doc });
}
