import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, signToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
