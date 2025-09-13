
// src/lib/firebase/auth.ts
'use client';

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser,
    type User
} from 'firebase/auth';
import { app } from './config';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export type AuthenticatedUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

type UserProfile = {
    firstName: string;
    lastName: string;
}

// Function to grant free monthly pro subscription
const grantFreeProSubscription = async (user: User) => {
    try {
        const userRef = doc(db, 'users', user.uid);
        const now = new Date();
        const expiryDate = new Date(now.setMonth(now.getMonth() + 1));

        await setDoc(userRef, {
             proMembership: {
                planId: 'monthly_pro',
                grantedBy: 'signup_offer',
                startedAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(expiryDate),
                status: 'active'
            } 
        }, { merge: true });
        console.log(`Granted free monthly pro to ${user.uid}`);
    } catch (error) {
        console.error("Failed to grant free pro subscription:", error);
    }
}

// Client-side functions
export const signup = async (email: string, password: string, profile: UserProfile, offerEnabled: boolean) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, {
    displayName: `${profile.firstName} ${profile.lastName}`.trim(),
  });
  
  // Grant free pro if offer is active
  if (offerEnabled) {
    await grantFreeProSubscription(userCredential.user);
  }

  // We don't need to create a session here, as the user should verify their email first.
  // The user will log in after verification, which will create the session.
  await sendEmailVerification(userCredential.user);
  return userCredential;
};

const createSession = async (idToken: string) => {
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        throw new Error('Failed to create session');
    }
}

export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  if (!userCredential.user.emailVerified) {
    await signOut(auth);
    // Clear any potential server session
    await fetch('/api/auth/session', { method: 'DELETE' });
    throw new Error('Please verify your email before logging in.');
  }
  const idToken = await userCredential.user.getIdToken();
  await createSession(idToken);

  // One-time check to assign superadmin role
  if (email === 'kapil.webfoxtech@gmail.com') {
    // We don't need to wait for this to complete. Fire and forget.
    fetch('/api/auth/set-admin', { method: 'POST' });
  }

  return userCredential;
};

export const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Ensure the photoURL from Google is saved to the Firebase user profile
    if (user.photoURL) {
        await updateProfile(user, {
            photoURL: user.photoURL
        });
    }

    const idToken = await user.getIdToken();
    await createSession(idToken);
    
    // One-time check to assign superadmin role
    if (user.email === 'kapil.webfoxtech@gmail.com') {
        // We don't need to wait for this to complete. Fire and forget.
         fetch('/api/auth/set-admin', { method: 'POST' });
    }

    return result;
}

export const logout = async () => {
  await signOut(auth);
  // Also clear the server-side session
  await fetch('/api/auth/session', { method: 'DELETE' });
};

export const onAppAuthStateChanged = (callback: (user: AuthenticatedUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
        callback({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            picture: user.photoURL,
        });
    } else {
        callback(null);
    }
  });
};

export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not found");

    const profileUpdates: { displayName?: string; photoURL?: string } = {};

    if (displayName) {
        profileUpdates.displayName = displayName.trim();
    }
    if (photoURL) {
        profileUpdates.photoURL = photoURL;
    }

    if(Object.keys(profileUpdates).length > 0) {
        await updateProfile(user, profileUpdates);
    }
};


export const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
}

export const updateUserPassword = async (newPassword: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not found");
    await updatePassword(user, newPassword);
}

export const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not found or email is missing");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
}

export const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not found");
    await deleteUser(user);
}
