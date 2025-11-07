export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/db';
import Message from '../../../../models/Message';
import User from '../../../../models/User';
import { getAuthUserFromCookies } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');
  const q = since ? { createdAt: { $gt: new Date(since) } } : {};
  const messages = await Message.find(q).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ messages });
}

export async function POST(req) {
  await dbConnect();
  const user = getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await User.findById(user.id).lean();
  const { text = '' } = await req.json();
  if (!text.trim()) return NextResponse.json({ error: 'Empty text' }, { status: 400 });
  const doc = await Message.create({ userId: user.id, name: profile?.name || profile?.email?.split('@')[0] || 'User', text: text.trim() });
  return NextResponse.json({ ok: true, message: doc });
}
