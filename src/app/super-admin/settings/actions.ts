'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

export type PuzzleNameDisplay = "formatted" | "generic" | "filename";

export type SiteSettings = {
    mobilePlayEnabled: boolean;
    offerEnabled: boolean;
    offerTitle: string;
    offerDescription: string;
    offerShopNowText: string;
    puzzleNameDisplay: PuzzleNameDisplay;
    puzzleGenericName: string;
    trophyRoomIsPro: boolean;
    interestFormEnabled: boolean;
};

const defaultSettings: SiteSettings = {
    mobilePlayEnabled: true,
    offerEnabled: false,
    offerTitle: 'Limited Time Offer!',
    offerDescription: 'Sign up now to get exclusive benefits.',
    offerShopNowText: 'SHOP NOW',
    puzzleNameDisplay: 'formatted',
    puzzleGenericName: 'Puzzle',
    trophyRoomIsPro: false,
    interestFormEnabled: true,
};


export async function getSiteSettings(): Promise<SiteSettings> {
    console.log('[SERVER ACTION] getSiteSettings');
    try {
        const db = getFirestore(app);
        const settingsDoc = await db.collection('settings').doc('site').get();
        const data = settingsDoc.data();
        
        // Return settings merged with defaults
        return {
            ...defaultSettings,
            ...data,
        };
    } catch (error) {
        console.error("Error fetching site settings:", error);
        // Default on error
        return defaultSettings;
    }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; message: string }> {
    console.log('[SERVER ACTION] updateSiteSettings');
    await verifyAdmin();
    
    try {
        const db = getFirestore(app);
        await db.collection('settings').doc('site').set(settings, { merge: true });

        // Revalidate all paths that might be affected
        revalidatePath('/', 'layout');
        revalidatePath('/puzzles', 'layout');
        revalidatePath('/category', 'layout');
        revalidatePath('/account', 'layout');
        revalidatePath('/play', 'layout');
        revalidatePath('/membership');
        revalidatePath('/super-admin/settings');
        revalidatePath('/super-admin/offers');

        
        return {
            success: true,
            message: 'Settings updated successfully!',
        };

    } catch(error) {
        console.error("Error updating settings:", error);
        return {
            success: false,
            message: 'An unexpected error occurred.',
        };
    }
}
