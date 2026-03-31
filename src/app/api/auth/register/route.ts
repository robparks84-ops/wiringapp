import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth';
import { findUserByEmail, createUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({ name, email, passwordHash });
    const token = signToken({ id: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
