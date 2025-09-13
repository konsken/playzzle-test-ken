// src/app/api/auth/set-admin/route.ts
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

// This is a special, one-time-use endpoint to grant superadmin privileges.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    // IMPORTANT: Security check to ensure only the intended user can become an admin.
    if (!user || user.email !== 'kapil.webfoxtech@gmail.com') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Set the custom claim
    await getAuth(app).setCustomUserClaims(user.uid, { superadmin: true });

    return NextResponse.json({ status: 'success', message: 'Super admin claim set.' });
  } catch (error) {
    console.error('Error setting super admin claim:', error);
    return NextResponse.json({ error: 'Failed to set admin claim' }, { status: 500 });
  }
}
