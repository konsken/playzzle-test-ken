// src/lib/firebase/server-auth.ts
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { app as adminApp } from './admin-config';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export type AuthenticatedUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  customClaims?: { [key: string]: any };
  isPro: boolean;
  proExpiry?: string | null;
  unlockedPuzzleIds: string[];
  singlePurchaseCredits: { count: number; transactionIds: string[] };
  wishlist: string[];
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
    
    // Fetch all user-related data in one go
    const db = getFirestore(adminApp);
    const userDocRef = db.collection('users').doc(uid);
    const unlockedPuzzlesRef = db.collection('unlockedPuzzles').where('userId', '==', uid);
    const creditsRef = db.collection('transactions').where('userId', '==', uid).where('planId', '==', 'single_puzzle').where('status', '==', 'success').where('creditUsed', '==', false);
    const wishlistRef = db.collection('wishlists').doc(uid);

    const [userDoc, unlockedSnapshot, creditsSnapshot, wishlistDoc] = await Promise.all([
        userDocRef.get(),
        unlockedPuzzlesRef.get(),
        creditsRef.get(),
        wishlistRef.get()
    ]);
    
    // Process Pro Status
    let isPro = false;
    let proExpiry = null;
    if (userDoc.exists) {
        const userData = userDoc.data();
        const proMembership = userData?.proMembership;
        if (proMembership && proMembership.status === 'active' && proMembership.expiresAt?.toDate() > new Date()) {
            isPro = true;
            proExpiry = proMembership.expiresAt.toDate().toISOString();
        }
    }
    if (customClaims?.superadmin) {
        isPro = true;
    }
    
    // Process Unlocked Puzzles
    const unlockedPuzzleIds = unlockedSnapshot.empty ? [] : unlockedSnapshot.docs.map(doc => doc.data().puzzleId as string);
    
    // Process Credits
    const singlePurchaseCredits = {
        count: creditsSnapshot.size,
        transactionIds: creditsSnapshot.docs.map(doc => doc.id)
    };

    // Process Wishlist
    const wishlist = wishlistDoc.exists ? (wishlistDoc.data()?.puzzles || []) : [];

    return {
      uid,
      email: email || null,
      name: name || null,
      picture: picture || null,
      customClaims,
      isPro,
      proExpiry,
      unlockedPuzzleIds,
      singlePurchaseCredits,
      wishlist
    };
  } catch (error) {
    // Session cookie is invalid. Force user to login again.
    // Here we might want to clear the cookie
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
