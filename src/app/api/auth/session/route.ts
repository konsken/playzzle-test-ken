// src/app/api/auth/session/route.ts
import { getAuth } from 'firebase-admin/auth';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { app } from '@/lib/firebase/admin-config';

// Helper to get detailed request info
function getRequestDetails(request: NextRequest) {
    const heads = headers();
    const ip = request.ip || heads.get('x-forwarded-for') || 'unknown';
    const userAgent = heads.get('user-agent') || 'unknown';
    return {
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
        method: request.method,
        ip,
        userAgent,
    };
}

export async function POST(request: NextRequest) {
  const requestDetails = getRequestDetails(request);
  console.log('[API] POST /api/auth/session - Request Details:', JSON.stringify(requestDetails));

  const reqBody = await request.json();
  const idToken = reqBody.idToken;

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await getAuth(app).createSessionCookie(idToken, { expiresIn });
    cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const requestDetails = getRequestDetails(request);
  console.log('[API] DELETE /api/auth/session - Request Details:', JSON.stringify(requestDetails));
  
  cookies().delete('__session');
  return NextResponse.json({ status: 'success' });
}
