'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

export type InterestedUser = {
    id: string;
    name: string;
    email: string;
    createdAt: string; // ISO string
};

export type PaginatedUsers = {
    users: InterestedUser[];
    totalCount: number;
};

export async function getInterestedUsers(page = 1, limit = 10, searchQuery = ''): Promise<PaginatedUsers> {
    console.log('[SERVER ACTION] getInterestedUsers');
    await verifyAdmin();
    try {
        const db = getFirestore(app);
        const submissionsRef = db.collection('proInterestSubmissions');
        
        const snapshot = await submissionsRef.orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            return { users: [], totalCount: 0 };
        }

        let allUsers = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp).toDate().toISOString();
            return {
                id: doc.id,
                ...data,
                createdAt,
            } as InterestedUser;
        });

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            allUsers = allUsers.filter(user => 
                user.name.toLowerCase().includes(lowercasedQuery) ||
                user.email.toLowerCase().includes(lowercasedQuery)
            );
        }

        const totalCount = allUsers.length;
        const paginatedUsers = allUsers.slice((page - 1) * limit, page * limit);

        return { users: paginatedUsers, totalCount };

    } catch (error) {
        console.error('Error fetching interested users:', error);
        return { users: [], totalCount: 0 };
    }
}
