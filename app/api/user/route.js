import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '../../../lib/auth';

export async function GET() {
  const user = getAuthUserFromCookies();
  return NextResponse.json({ user });
}
