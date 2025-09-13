
// src/app/account/actions.ts
'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue, DocumentSnapshot } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export type ProfileFormState = {
    message: string;
    status: 'success' | 'error';
} | {
    message: null;
    status: null;
}

export async function updateProfile(
    prevState: ProfileFormState,
    formData: FormData
): Promise<ProfileFormState> {
    console.log('[SERVER ACTION] updateProfile');
    const user = await getAuthenticatedUser();
    if (!user) {
        return {
            message: 'You must be logged in to update your profile.',
            status: 'error',
        };
    }

    const validatedFields = profileFormSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid form data. Please check your entries.',
            status: 'error',
        };
    }
    
    const { firstName, lastName } = validatedFields.data;
    const displayName = `${firstName} ${lastName || ''}`.trim();

    try {
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Update display name in Firebase Auth
        await auth.updateUser(user.uid, {
            displayName,
        });

        // Also save the name parts in Firestore for consistency,
        // which helps avoid issues with Google sign-in overwriting displayName.
        await db.collection('users').doc(user.uid).set({
            firstName,
            lastName: lastName || '',
        }, { merge: true });


        revalidatePath('/account');
        revalidatePath('/'); // To update the navbar

        return {
            message: 'Your profile has been updated successfully.',
            status: 'success',
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        return {
            message: 'An unexpected error occurred. Please try again.',
            status: 'error',
        };
    }
}


type TransactionData = {
    paymentId: string;
    orderId: string;
    signature?: string;
    amount: number;
    currency: string;
    planId: string;
    puzzleId?: string;
    status: 'success' | 'failed';
    failureReason?: string;
}

export async function recordTransaction(data: TransactionData) {
    console.log('[SERVER ACTION] recordTransaction');
    const user = await getAuthenticatedUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const db = getFirestore(app);
    const batch = db.batch();

    // 1. Record the transaction
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, {
        ...data,
        userId: user.uid,
        userEmail: user.email,
        createdAt: FieldValue.serverTimestamp(),
        creditUsed: false,
    });

    // 2. If it's a successful purchase, update user status or unlocked content
    if (data.status === 'success') {
        if (data.planId === 'single_puzzle' && data.puzzleId) {
            // This now represents a CREDIT purchase, not an immediate unlock.
            // The credit will be used later. The `useSinglePuzzleCredit` action will handle the unlocking.
        } else if (data.planId === 'monthly_pro' || data.planId === 'yearly_pro') {
            // Grant or extend a pro subscription
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            
            const now = new Date();
            let newExpiryDate = new Date();
            
            // If user has an existing, non-expired subscription, extend it.
            const currentExpiry = userData?.proMembership?.expiresAt?.toDate();
            const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

            if (data.planId === 'monthly_pro') {
                newExpiryDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
            } else if (data.planId === 'yearly_pro') {
                newExpiryDate = new Date(startDate.setFullYear(startDate.getFullYear() + 1));
            }

            batch.set(userRef, { 
                proMembership: {
                    planId: data.planId,
                    startedAt: FieldValue.serverTimestamp(),
                    expiresAt: Timestamp.fromDate(newExpiryDate),
                    status: 'active'
                } 
            }, { merge: true });
        }
    }
    
    await batch.commit();
    revalidatePath('/account');
    revalidatePath('/membership');
    revalidatePath('/puzzles');
    revalidatePath('/category', 'layout');
}


export async function getUnlockedPuzzles(userId: string): Promise<string[]> {
    console.log('[SERVER ACTION] getUnlockedPuzzles');
    try {
        const db = getFirestore(app);
        const snapshot = await db.collection('unlockedPuzzles').where('userId', '==', userId).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data().puzzleId as string);
    } catch (error) {
        console.error("Error fetching unlocked puzzles: ", error);
        return [];
    }
}

export type PuzzleDetails = {
    src: string;
    category: string;
    filename: string;
}

export type Transaction = {
  id: string;
  createdAt: string;
  expiry: string | null;
  [key: string]: any;
};

export type GetTransactionsResult = {
  transactions: Transaction[];
  error?: {
    code: string;
    message: string;
  };
};

export async function getTransactions(userId: string): Promise<GetTransactionsResult> {
    console.log('[SERVER ACTION] getTransactions');
    const db = getFirestore(app);
    try {
        const transactionsSnapshot = await db.collection('transactions').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
        
        if (transactionsSnapshot.empty) {
            return { transactions: [] };
        }

        const userDoc = await db.collection('users').doc(userId).get();
        const userProData = userDoc.exists ? userDoc.data()?.proMembership : null;
        
        const transactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            let expiry = null;
            if ((data.planId === 'monthly_pro' || data.planId === 'yearly_pro') && userProData?.expiresAt) {
                expiry = (userProData.expiresAt as Timestamp).toDate().toISOString();
            }

            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
                expiry,
            } as Transaction;
        });
        
        return { transactions };

    } catch (error: any) {
        console.error("Error fetching transactions: ", error);
        // This is the specific error code for a missing index
        if (error.code === 9 || (error.code === 'FAILED_PRECONDITION' && error.message.includes('index'))) {
           return { 
                transactions: [], 
                error: {
                    code: 'FAILED_PRECONDITION', // Standardize the code
                    message: error.message // Pass the full message to get the creation URL
                }
            };
        }
        return { transactions: [], error: { code: 'UNKNOWN', message: 'An unexpected error occurred.'} };
    }
}


export async function getUserProStatus(userId: string): Promise<{ isPro: boolean }> {
    console.log('[SERVER ACTION] getUserProStatus');
    try {
        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return { isPro: false };
        }
        
        const userData = userDoc.data();
        const proMembership = userData?.proMembership;

        if (proMembership && (proMembership.status === 'active' || proMembership.status === 'cancelled')) {
            const expiryDate = proMembership.expiresAt.toDate();
            if (expiryDate > new Date()) {
                return { isPro: true };
            }
        }

        return { isPro: false };
    } catch (error) {
        console.error("Error fetching user pro status:", error);
        return { isPro: false };
    }
}

export type SubscriptionDetails = {
    planId: 'monthly_pro' | 'yearly_pro' | null;
    status: 'active' | 'expired' | 'none' | 'cancelled';
    startedAt: string | null;
    expiresAt: string | null;
    daysRemaining: number | null;
    userId?: string;
}

export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails> {
    console.log('[SERVER ACTION] getSubscriptionDetails');
    const db = getFirestore(app);
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists || !userDoc.data()?.proMembership) {
        return { planId: null, status: 'none', startedAt: null, expiresAt: null, daysRemaining: null };
    }

    const proMembership = userDoc.data()?.proMembership;
    
    // If status is 'cancelled', we still need to show details
    if (!proMembership.expiresAt) {
        // Fallback for cases where data might be inconsistent
        return { planId: proMembership.planId, status: proMembership.status, startedAt: null, expiresAt: null, daysRemaining: null };
    }

    const now = new Date();
    const expiryDate = proMembership.expiresAt.toDate();
    const startDate = proMembership.startedAt.toDate();
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    let status = proMembership.status;
    if (status === 'active' && now > expiryDate) {
        status = 'expired';
    }
    
    return {
        planId: proMembership.planId,
        status: status,
        startedAt: startDate.toISOString(),
        expiresAt: expiryDate.toISOString(),
        daysRemaining,
    };
}


export async function getSinglePuzzleCredits(userId: string): Promise<{ count: number, transactionIds: string[] }> {
    console.log('[SERVER ACTION] getSinglePuzzleCredits');
    try {
        const db = getFirestore(app);
        const query = db.collection('transactions')
            .where('userId', '==', userId)
            .where('planId', '==', 'single_puzzle')
            .where('status', '==', 'success')
            .where('creditUsed', '==', false);

        const snapshot = await query.get();
        if (snapshot.empty) {
            return { count: 0, transactionIds: [] };
        }

        const transactionIds = snapshot.docs.map(doc => doc.id);
        return { count: snapshot.size, transactionIds };
    } catch (error: any) {
        if (error.code === 9 || (error.code === 'FAILED_PRECONDITION' && error.message.includes('index'))) {
            console.warn("Firestore index for single puzzle credit query is missing.");
        } else {
            console.error("Error fetching single puzzle credits: ", error);
        }
        return { count: 0, transactionIds: [] };
    }
}

export async function useSinglePuzzleCredit(transactionId: string, puzzleId: string, category: string): Promise<{ success: boolean, message: string }> {
    console.log('[SERVER ACTION] useSinglePuzzleCredit');
    const user = await getAuthenticatedUser();
    if (!user) {
        return { success: false, message: 'You must be logged in.' };
    }

    const db = getFirestore(app);
    const batch = db.batch();

    const transactionRef = db.collection('transactions').doc(transactionId);
    batch.update(transactionRef, { creditUsed: true, usedForPuzzleId: puzzleId });

    const unlockedRef = db.collection('unlockedPuzzles').doc(`${user.uid}_${puzzleId}`);
    batch.set(unlockedRef, {
        userId: user.uid,
        puzzleId: puzzleId,
        unlockedAt: FieldValue.serverTimestamp()
    });

    try {
        await batch.commit();
        revalidatePath('/account');
        revalidatePath('/puzzles');
        revalidatePath(`/category/${category}`);

        return { success: true, message: 'Puzzle unlocked successfully.' };

    } catch (error) {
        console.error("Error using single puzzle credit:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

export async function cancelSubscription(userId: string): Promise<{success: boolean, message: string}> {
    console.log('[SERVER ACTION] cancelSubscription');
    const user = await getAuthenticatedUser();
    if (!user || user.uid !== userId) {
        return { success: false, message: 'Not authorized.' };
    }

    const db = getFirestore(app);
    const userRef = db.collection('users').doc(userId);
    
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists || !userDoc.data()?.proMembership || userDoc.data()?.proMembership.status !== 'active') {
            return { success: false, message: 'No active subscription found to cancel.' };
        }
        
        await userRef.update({
            'proMembership.status': 'cancelled'
        });

        revalidatePath('/account');
        revalidatePath('/'); // Revalidate root to update nav bar pro status

        return { success: true, message: 'Your subscription has been cancelled. You will retain Pro access until the end of your billing period.' };

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

// New function to get user data from Firestore
export async function getFirestoreUser(uid: string) {
    console.log('[SERVER ACTION] getFirestoreUser');
    try {
        const db = getFirestore(app);
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching Firestore user:", error);
        return null;
    }
}

// Wishlist Actions
export async function getWishlist(userId: string): Promise<string[]> {
    console.log('[SERVER ACTION] getWishlist');
    try {
        const db = getFirestore(app);
        const wishlistDoc = await db.collection('wishlists').doc(userId).get();
        if (wishlistDoc.exists) {
            return wishlistDoc.data()?.puzzles || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching wishlist: ", error);
        return [];
    }
}

export async function toggleWishlist(puzzleId: string): Promise<{ success: boolean; added: boolean; message: string }> {
    console.log('[SERVER ACTION] toggleWishlist');
    const user = await getAuthenticatedUser();
    if (!user) {
        return { success: false, added: false, message: "You must be logged in." };
    }

    const db = getFirestore(app);
    const wishlistRef = db.collection('wishlists').doc(user.uid);

    try {
        const doc = await wishlistRef.get();
        if (!doc.exists) {
            await wishlistRef.set({ puzzles: [puzzleId], userId: user.uid });
            revalidatePath('/', 'layout');
            return { success: true, added: true, message: "Added to wishlist." };
        } else {
            const puzzles = doc.data()?.puzzles || [];
            if (puzzles.includes(puzzleId)) {
                // Remove from wishlist
                await wishlistRef.update({ puzzles: FieldValue.arrayRemove(puzzleId) });
                 revalidatePath('/', 'layout');
                return { success: true, added: false, message: "Removed from wishlist." };
            } else {
                // Add to wishlist
                await wishlistRef.update({ puzzles: FieldValue.arrayUnion(puzzleId) });
                 revalidatePath('/', 'layout');
                return { success: true, added: true, message: "Added to wishlist." };
            }
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        return { success: false, added: false, message: "An unexpected error occurred." };
    }
}


export type SolvedAttempt = {
    id: string;
    gameType: 'slide' | 'jigsaw';
    difficulty: number;
    timeInSeconds: number;
    moves: number;
    completedAt: string; // ISO string
};

export type GroupedSolvedPuzzle = {
    puzzleSlug: string;
    category: string;
    src: string;
    filename: string;
    lastCompleted: string; // ISO string to sort the main list
    attempts: SolvedAttempt[];
};

export type GetSolvedPuzzlesResult = {
    puzzles: GroupedSolvedPuzzle[];
    error?: {
        code: string;
        message: string;
    };
};

// Helper function to find the current filename, accounting for renames
async function findCurrentFilename(category: string, originalFilename: string): Promise<string | null> {
    const categoryDir = path.join(process.cwd(), 'public', 'puzzles', category);
    try {
        const files = await fs.readdir(categoryDir);
        // Extract the base name of the original file (e.g., 'cat' from '_pro_cat.jpg')
        const baseFilename = originalFilename.replace(/^_pro_|_upcoming_|_disabled_|\.jpg|\.jpeg|\.png|\.webp/g, '').replace(/-/g, ' ');

        // Find a file in the directory that contains this base name.
        // This is flexible and handles any prefix.
        const matchingFile = files.find(file => 
            file.replace(/^_pro_|_upcoming_|_disabled_|\.jpg|\.jpeg|\.png|\.webp/g, '').replace(/-/g, ' ')
            .includes(baseFilename)
        );

        return matchingFile || null;
    } catch (error) {
        // If the category directory doesn't exist, we can't find the file.
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        console.error(`Error reading directory ${categoryDir}:`, error);
        return null;
    }
}

export async function getSolvedPuzzleHistory(
    userId: string,
): Promise<GetSolvedPuzzlesResult> {
    console.log('[SERVER ACTION] getSolvedPuzzleHistory');
    try {
        const db = getFirestore(app);
        let query = db.collection('gameHistory')
            .where('uid', '==', userId)
            .orderBy('completedAt', 'desc');

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            return { puzzles: [] };
        }

        const grouped: Record<string, GroupedSolvedPuzzle> = {};

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const puzzleSlug = data.puzzleSlug || '';
            
            const completedAt = (data.completedAt as Timestamp).toDate().toISOString();

            // If we haven't processed this puzzle image yet, find its current info
            if (!grouped[puzzleSlug]) {
                const [category, originalFilename] = puzzleSlug.split('/');
                if (!category || !originalFilename) continue;

                const currentFilename = await findCurrentFilename(category, originalFilename);
                
                if (currentFilename) {
                    grouped[puzzleSlug] = {
                        puzzleSlug: puzzleSlug,
                        category: category,
                        filename: currentFilename,
                        src: `/puzzles/${category}/${currentFilename}`,
                        lastCompleted: '1970-01-01T00:00:00.000Z', // Initialize with old date
                        attempts: [],
                    };
                } else {
                    // Could not find the file, maybe it was deleted. Skip it.
                    continue;
                }
            }
            
            // This check ensures we only add attempts if the puzzle was found
            if (grouped[puzzleSlug]) {
                 grouped[puzzleSlug].attempts.push({
                    id: doc.id,
                    gameType: data.gameType,
                    difficulty: data.difficulty,
                    timeInSeconds: data.timeInSeconds,
                    moves: data.moves,
                    completedAt: completedAt,
                });
                // Update lastCompleted time to ensure correct sorting
                 if (new Date(completedAt) > new Date(grouped[puzzleSlug].lastCompleted)) {
                    grouped[puzzleSlug].lastCompleted = completedAt;
                }
            }
        }
        
        // Post-process to keep only the best attempt for each difficulty
        Object.values(grouped).forEach(puzzle => {
            const bestAttempts = new Map<string, SolvedAttempt>();
            
            puzzle.attempts.forEach(attempt => {
                const key = `${attempt.gameType}-${attempt.difficulty}`;
                const existingBest = bestAttempts.get(key);

                if (!existingBest || attempt.timeInSeconds < existingBest.timeInSeconds) {
                    bestAttempts.set(key, attempt);
                }
            });

            puzzle.attempts = Array.from(bestAttempts.values());
        });


        const puzzles = Object.values(grouped).sort((a, b) => 
            new Date(b.lastCompleted).getTime() - new Date(a.lastCompleted).getTime()
        );
        
        return { puzzles };

    } catch (error: any) {
        console.error("Error fetching solved puzzles:", error);
        if (error.code === 9 || (error.code === 'FAILED_PRECONDITION' && error.message.includes('index'))) {
           return { 
                puzzles: [], 
                error: {
                    code: 'FAILED_PRECONDITION',
                    message: error.message
                }
            };
        }
        return { puzzles: [], error: { code: 'UNKNOWN', message: 'An unexpected error occurred.'} };
    }
}

    