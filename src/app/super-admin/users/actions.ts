'use server';

import { revalidatePath } from 'next/cache';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

const auth = getAuth(app);
const db = getFirestore(app);

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

export type SimpleUser = {
    uid: string;
    email?: string;
    displayName?: string;
    disabled: boolean;
    isSuperAdmin: boolean;
    proTier?: string; // 'monthly_pro', 'yearly_pro'
    proExpiry?: string; // ISO string
};

export type PaginatedUsers = {
    users: SimpleUser[];
    totalCount: number;
    counts: {
        all: number;
        superadmin: number;
        pro: number;
        standard: number;
    }
}

export type UserFilter = 'all' | 'superadmin' | 'pro' | 'standard';


export async function getUsers(page = 1, limit = 10, searchQuery = '', filter: UserFilter = 'all'): Promise<PaginatedUsers> {
    console.log(`[SERVER ACTION] getUsers (page: ${page}, limit: ${limit}, query: "${searchQuery}", filter: ${filter})`);
    await verifyAdmin();
    try {
        let allAuthUsers: UserRecord[] = [];
        let nextPageToken: string | undefined;

        // Paginate through all users from Firebase Auth
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            allAuthUsers = allAuthUsers.concat(listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        
        const defaultResponse = { users: [], totalCount: 0, counts: { all: 0, superadmin: 0, pro: 0, standard: 0 } };
        
        if (allAuthUsers.length === 0) return defaultResponse;
        
        // Fetch all user docs from Firestore to determine roles before filtering
        const userDocsSnapshot = await db.collection('users').get();
        const usersData = userDocsSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {} as Record<string, any>);


        let allUsers: SimpleUser[] = allAuthUsers.map((user: UserRecord) => {
            const userData = usersData[user.uid];
            const proMembership = userData?.proMembership;
            let proTier;
            let proExpiry;

            if (proMembership && proMembership.status === 'active' && proMembership.expiresAt.toDate() > new Date()) {
                proTier = proMembership.planId;
                proExpiry = proMembership.expiresAt.toDate().toISOString();
            }

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                disabled: user.disabled,
                isSuperAdmin: !!user.customClaims?.superadmin,
                proTier,
                proExpiry,
            }
        });
        
        // Calculate counts before any filtering
        const counts = allUsers.reduce((acc, user) => {
            acc.all++;
            if (user.isSuperAdmin) acc.superadmin++;
            else if (user.proTier) acc.pro++;
            else acc.standard++;
            return acc;
        }, { all: 0, superadmin: 0, pro: 0, standard: 0 });

        let filteredUsers = allUsers;
        // 1. Filter by role
        if (filter !== 'all') {
            filteredUsers = filteredUsers.filter(user => {
                switch(filter) {
                    case 'superadmin': return user.isSuperAdmin;
                    case 'pro': return !!user.proTier;
                    case 'standard': return !user.isSuperAdmin && !user.proTier;
                    default: return true;
                }
            });
        }
        
        // 2. Filter by search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                (user.displayName && user.displayName.toLowerCase().includes(lowercasedQuery)) ||
                (user.email && user.email.toLowerCase().includes(lowercasedQuery))
            );
        }

        const totalCount = filteredUsers.length;
        const startIndex = (page - 1) * limit;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);
        
        return { users: paginatedUsers, totalCount, counts };

    } catch (error) {
        console.error('Error fetching users:', error);
        return { users: [], totalCount: 0, counts: { all: 0, superadmin: 0, pro: 0, standard: 0 } };
    }
}

export async function deleteUser(uid: string) {
    console.log('[SERVER ACTION] deleteUser');
    await verifyAdmin();
    try {
        await auth.deleteUser(uid);
        // Optionally delete user data from Firestore as well
        await db.collection('users').doc(uid).delete();
        revalidatePath('/super-admin/users');
        return { success: true, message: 'User deleted successfully.' };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'Failed to delete user.' };
    }
}

export async function toggleUserDisabled(uid: string, disabled: boolean) {
    console.log('[SERVER ACTION] toggleUserDisabled');
    await verifyAdmin();
    try {
        await auth.updateUser(uid, { disabled });
        revalidatePath('/super-admin/users');
        return { success: true, message: `User ${disabled ? 'disabled' : 'enabled'} successfully.` };
    } catch (error) {
        console.error('Error updating user state:', error);
        return { success: false, message: 'Failed to update user state.' };
    }
}

export async function toggleSuperAdmin(uid: string, isSuperAdmin: boolean) {
    console.log('[SERVER ACTION] toggleSuperAdmin');
    await verifyAdmin();
    try {
        await auth.setCustomUserClaims(uid, { superadmin: isSuperAdmin });
        revalidatePath('/super-admin/users');
        return { success: true, message: `User role updated successfully.` };
    } catch (error) {
        console.error('Error setting custom claims:', error);
        return { success: false, message: 'Failed to update user role.' };
    }
}

export async function grantProMembership(uid: string, planId: 'monthly_pro' | 'yearly_pro') {
    console.log('[SERVER ACTION] grantProMembership');
    await verifyAdmin();
    try {
        const userRef = db.collection('users').doc(uid);
        const now = new Date();
        let newExpiryDate = new Date();

        if (planId === 'monthly_pro') {
            newExpiryDate.setMonth(now.getMonth() + 1);
        } else if (planId === 'yearly_pro') {
            newExpiryDate.setFullYear(now.getFullYear() + 1);
        }

        await userRef.set({ 
            proMembership: {
                planId: planId,
                grantedByAdmin: true,
                startedAt: Timestamp.now(),
                expiresAt: Timestamp.fromDate(newExpiryDate),
                status: 'active'
            } 
        }, { merge: true });

        revalidatePath('/super-admin/users');
        return { success: true, message: `Pro membership (${planId}) granted.` };
    } catch (error) {
        console.error('Error granting pro membership:', error);
        return { success: false, message: 'Failed to grant pro membership.' };
    }
}


export async function revokeProMembership(uid: string) {
    console.log('[SERVER ACTION] revokeProMembership');
    await verifyAdmin();
    try {
        const userRef = db.collection('users').doc(uid);
        // Setting expiresAt to the past is a simple way to revoke access
        await userRef.set({ 
            proMembership: {
                status: 'revoked',
                expiresAt: Timestamp.now(),
            } 
        }, { merge: true });

        revalidatePath('/super-admin/users');
        return { success: true, message: 'Pro membership revoked.' };
    } catch (error) {
        console.error('Error revoking pro membership:', error);
        return { success: false, message: 'Failed to revoke pro membership.' };
    }
}
