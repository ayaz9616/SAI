export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '../../../lib/db';
import HelpRequest from '../../../models/HelpRequest';
import { getAuthUserFromCookies } from '../../../lib/auth';

export async function GET() {
  await dbConnect();
  const list = await HelpRequest.find().sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ list });
}

export async function POST(req) {
  await dbConnect();
  const user = getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { message = 'Need help', location = null } = await req.json();
  const doc = await HelpRequest.create({ userId: user.id, message, location });
  return NextResponse.json({ ok: true, request: doc });
}
