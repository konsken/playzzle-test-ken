// src/lib/firebase/server-auth.ts
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { app as adminApp } from './admin-config';
import { getFirestore } from 'firebase-admin/firestore';

export type AuthenticatedUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  customClaims?: { [key: string]: any };
  proTier?: string;
  proExpiry?: string | null;
};


// Server-side function
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedIdToken: DecodedIdToken = await getAdminAuth(adminApp).verifySessionCookie(sessionCookie, true);
    const { uid, email, name, picture, ...customClaims } = decodedIdToken;
    
    // Fetch pro status from Firestore only once during session verification
    const db = getFirestore(adminApp);
    const userDoc = await db.collection('users').doc(uid).get();
    let proTier, proExpiry;

    if (userDoc.exists) {
        const userData = userDoc.data();
        const proMembership = userData?.proMembership;
        if (proMembership && proMembership.expiresAt) {
            proTier = proMembership.planId;
            proExpiry = proMembership.expiresAt.toDate().toISOString();
        }
    }

    return {
      uid,
      email: email || null,
      name: name || null,
      picture: picture || null,
      customClaims,
      proTier,
      proExpiry,
    };
  } catch (error) {
    // Session cookie is invalid. Force user to login again.
    // Here we might want to clear the cookie
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
