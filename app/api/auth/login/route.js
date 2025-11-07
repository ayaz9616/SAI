export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '../../../../lib/db';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../../lib/auth';

export async function POST(req) {
  await dbConnect();
  const { email, password } = await req.json();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = signToken({ id: user._id.toString(), email: user.email });
  const res = NextResponse.json({ ok: true, user: { id: user._id, email: user.email } });
  res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
