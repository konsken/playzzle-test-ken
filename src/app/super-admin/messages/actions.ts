'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

export type ContactSubmission = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string; // ISO string
    read: boolean;
};

export type PaginatedMessages = {
    messages: ContactSubmission[];
    totalCount: number;
};

export async function getContactSubmissions(page = 1, limit = 10, searchQuery = ''): Promise<PaginatedMessages> {
    console.log('[SERVER ACTION] getContactSubmissions');
    await verifyAdmin();
    try {
        const db = getFirestore(app);
        const submissionsRef = db.collection('contactSubmissions');
        
        // Firestore does not support native text search on multiple fields.
        // For a production app, a dedicated search service like Algolia or Typesense is recommended.
        // For this implementation, we will fetch all documents and filter them in memory.
        // This is not efficient for very large datasets but is suitable for moderate numbers of messages.

        const snapshot = await submissionsRef.orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            return { messages: [], totalCount: 0 };
        }

        let allMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp).toDate().toISOString();
            return {
                id: doc.id,
                ...data,
                createdAt,
            } as ContactSubmission;
        });

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            allMessages = allMessages.filter(message => 
                message.firstName.toLowerCase().includes(lowercasedQuery) ||
                message.lastName.toLowerCase().includes(lowercasedQuery) ||
                message.email.toLowerCase().includes(lowercasedQuery) ||
                message.subject.toLowerCase().includes(lowercasedQuery)
            );
        }

        const totalCount = allMessages.length;
        const paginatedMessages = allMessages.slice((page - 1) * limit, page * limit);

        return { messages: paginatedMessages, totalCount };

    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        return { messages: [], totalCount: 0 };
    }
}


export async function markAsRead(id: string) {
    console.log('[SERVER ACTION] markAsRead');
    await verifyAdmin();
    try {
        const db = getFirestore(app);
        await db.collection('contactSubmissions').doc(id).update({ read: true });
        revalidatePath('/super-admin/messages');
        return { success: true, message: 'Message marked as read.' };
    } catch (error) {
        console.error('Error marking message as read:', error);
        return { success: false, message: 'Failed to mark as read.' };
    }
}

export async function deleteMessage(id: string) {
    console.log('[SERVER ACTION] deleteMessage');
    await verifyAdmin();
    try {
        const db = getFirestore(app);
        await db.collection('contactSubmissions').doc(id).delete();
        revalidatePath('/super-admin/messages');
        return { success: true, message: 'Message deleted.' };
    } catch (error) {
        console.error('Error deleting message:', error);
        return { success: false, message: 'Failed to delete message.' };
    }
}
