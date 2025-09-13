'use server';

import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
    return user;
}

export type RevenueStats = {
    total: number;
    count: number;
    last30Days: number;
    last30DaysCount: number;
    last365Days: number;
    last365DaysCount: number;
    error?: {
        code: string;
        message: string;
    };
};

export async function getRevenueStats(): Promise<RevenueStats> {
    console.log('[SERVER ACTION] getRevenueStats');
    await verifyAdmin();
    const db = getFirestore(app);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const threeSixtyFiveDaysAgo = new Date();
    threeSixtyFiveDaysAgo.setDate(threeSixtyFiveDaysAgo.getDate() - 365);
    
    const defaultStats = { total: 0, count: 0, last30Days: 0, last30DaysCount: 0, last365Days: 0, last365DaysCount: 0 };

    try {
        const snapshot = await db.collection('transactions').where('status', '==', 'success').get();

        if (snapshot.empty) {
            return defaultStats;
        }

        const stats = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp).toDate();

            acc.total += data.amount;
            acc.count++;

            if (createdAt >= thirtyDaysAgo) {
                acc.last30Days += data.amount;
                acc.last30DaysCount++;
            }
            if (createdAt >= threeSixtyFiveDaysAgo) {
                acc.last365Days += data.amount;
                acc.last365DaysCount++;
            }
            
            return acc;
        }, { ...defaultStats });

        return stats;

    } catch (error: any) {
        console.error("Error fetching revenue stats:", error);
         if (error.code === 'FAILED_PRECONDITION') {
           return { 
                ...defaultStats,
                error: {
                    code: error.code,
                    message: error.message
                }
            };
        }
        return defaultStats;
    }
}

export async function resetRevenueData(): Promise<{ success: boolean; message: string }> {
    console.log('[SERVER ACTION] resetRevenueData');
    const user = await verifyAdmin();
    if (user.email !== 'kapil.webfoxtech@gmail.com') {
        return { success: false, message: 'You are not authorized to perform this action.' };
    }

    const db = getFirestore(app);

    try {
        const query = db.collection('transactions');
        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, message: 'No revenue data to reset.' };
        }

        // Firestore batches are limited to 500 operations.
        const batchSize = 500;
        let batch = db.batch();
        let count = 0;
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;
            if (count === batchSize) {
                await batch.commit();
                batch = db.batch();
                count = 0;
                batchCount++;
            }
        }

        // Commit the final batch if it's not empty
        if (count > 0) {
            await batch.commit();
            batchCount++;
        }

        revalidatePath('/super-admin/revenue');

        return { success: true, message: `Successfully deleted all transaction data in ${batchCount} batch(es).` };

    } catch (error) {
        console.error("Error resetting revenue data:", error);
        return { success: false, message: 'An unexpected error occurred while resetting data.' };
    }
}
