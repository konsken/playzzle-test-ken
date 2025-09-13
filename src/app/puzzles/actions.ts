
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

// Action to create a new category
export async function createCategory(categoryName: string): Promise<{ success: boolean, message: string }> {
    console.log('[SERVER ACTION] createCategory');
    await verifyAdmin();

    const schema = z.string().min(3, "Category name must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.");
    const validation = schema.safeParse(categoryName);

    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    
    const db = getFirestore(app);

    try {
        // Check if category already exists in Firestore
        const categoryDoc = await db.collection('categories').doc(categoryName).get();
        if (categoryDoc.exists) {
            return { success: false, message: 'This category already exists.' };
        }

        const categoryDir = path.join(process.cwd(), 'public', 'puzzles', categoryName);
        await fs.mkdir(categoryDir, { recursive: true });
        
        // Add to Firestore
        const allCategories = await getCategories();
        await db.collection('categories').doc(categoryName).set({
            name: categoryName,
            displayOrder: allCategories.length + 1 // Add to the end
        });

        revalidatePath('/puzzles');
        revalidatePath('/super-admin/puzzles');
        return { success: true, message: `Category '${categoryName}' created successfully.` };
    } catch (error: any) {
        if (error.code === 'EEXIST') {
            return { success: false, message: 'This category already exists.' };
        }
        console.error('Error creating category:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

// Action to upload puzzle images. This action now handles multiple files.
export async function uploadPuzzle(formData: FormData): Promise<{ success: boolean, message: string, uploadedFiles: string[] }> {
    console.log('[SERVER ACTION] uploadPuzzle');
    await verifyAdmin();

    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string | null;

    if (!files || files.length === 0 || !category) {
        return { success: false, message: 'Files and category are required.', uploadedFiles: [] };
    }
    
    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles', category);
    await fs.mkdir(puzzlesDir, { recursive: true });
    
    for (const file of files) {
        if (file.size === 0) {
            errors.push(`Cannot upload an empty file: ${file.name}`);
            continue;
        }

        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Sanitize filename on the server
            const sanitizedFilename = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '');
            const filePath = path.join(puzzlesDir, sanitizedFilename);

            await fs.writeFile(filePath, buffer);
            uploadedFiles.push(sanitizedFilename);

        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            errors.push(`Failed to upload ${file.name}.`);
        }
    }

    if (uploadedFiles.length > 0) {
        revalidatePath('/puzzles');
        revalidatePath(`/category/${category}`);
        revalidatePath('/super-admin/puzzles');
    }
    
    if (errors.length > 0) {
        if (uploadedFiles.length > 0) {
            return { success: true, message: `Completed with some errors: ${uploadedFiles.length} uploaded, ${errors.length} failed. ${errors.join(' ')}`, uploadedFiles };
        } else {
            return { success: false, message: `All uploads failed. ${errors.join(' ')}`, uploadedFiles };
        }
    }

    return { success: true, message: `Successfully uploaded ${uploadedFiles.length} puzzle(s).`, uploadedFiles };
}


export async function renameCategory(oldName: string, newName: string): Promise<{ success: boolean, message: string }> {
    console.log('[SERVER ACTION] renameCategory');
    await verifyAdmin();
    
    const schema = z.string().min(3, "Category name must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.");
    const validation = schema.safeParse(newName);

    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }
    
    const db = getFirestore(app);

    try {
        // Rename folder
        const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');
        const oldPath = path.join(puzzlesDir, oldName);
        const newPath = path.join(puzzlesDir, newName);

        await fs.rename(oldPath, newPath);
        
        // Update Firestore document
        const oldDocRef = db.collection('categories').doc(oldName);
        const oldDoc = await oldDocRef.get();
        if (oldDoc.exists) {
            const data = oldDoc.data();
            await db.collection('categories').doc(newName).set({
                ...data,
                name: newName,
            });
            await oldDocRef.delete();
        }

        revalidatePath('/puzzles');
        revalidatePath(`/category/${oldName}`); // Old path will now 404
        revalidatePath(`/category/${newName}`);
        revalidatePath('/super-admin/puzzles');

        return { success: true, message: `Category renamed to '${newName}'.` };

    } catch (error) {
        console.error('Error renaming category:', error);
        return { success: false, message: 'An error occurred while renaming the category.' };
    }
}

export async function deleteCategory(categoryName: string): Promise<{ success: boolean, message: string }> {
    console.log('[SERVER ACTION] deleteCategory');
    await verifyAdmin();
    const db = getFirestore(app);

    try {
        const categoryDir = path.join(process.cwd(), 'public', 'puzzles', categoryName);
        await fs.rm(categoryDir, { recursive: true, force: true });
        
        // Delete from Firestore
        await db.collection('categories').doc(categoryName).delete();
        
        revalidatePath('/puzzles');
        revalidatePath(`/category/${categoryName}`);
        revalidatePath('/super-admin/puzzles');

        return { success: true, message: `Category '${categoryName}' and all its puzzles have been deleted.` };
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, message: 'An error occurred while deleting the category.' };
    }
}

export async function deletePuzzle(category: string, filename: string): Promise<{ success: boolean, message: string }> {
    console.log('[SERVER ACTION] deletePuzzle');
    await verifyAdmin();

    try {
        const filePath = path.join(process.cwd(), 'public', 'puzzles', category, filename);
        await fs.unlink(filePath);

        revalidatePath(`/category/${category}`);
        revalidatePath('/puzzles');
        revalidatePath('/super-admin/puzzles');

        return { success: true, message: `Puzzle '${filename}' deleted.` };
    } catch (error) {
        console.error('Error deleting puzzle:', error);
        return { success: false, message: 'An error occurred while deleting the puzzle.' };
    }
}

type PuzzleStatus = "pro" | "standard" | "upcoming" | "disabled" | "enabled";

export async function renamePuzzle(
    category: string,
    filename: string,
    status: PuzzleStatus
): Promise<{ success: boolean; message: string; newFilename: string }> {
    console.log('[SERVER ACTION] renamePuzzle');
    await verifyAdmin();

    try {
        const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');
        const oldPath = path.join(puzzlesDir, category, filename);
        
        const fileExt = path.extname(filename);
        let baseName = path.basename(filename, fileExt);

        // Remove existing prefixes
        baseName = baseName.replace(/^_pro_|_upcoming_|_disabled_/, '');

        let newFilename;
        let message;

        switch (status) {
            case 'pro':
                newFilename = `_pro_${baseName}${fileExt}`;
                message = "Puzzle marked as Pro.";
                break;
            case 'standard':
                newFilename = `${baseName}${fileExt}`;
                message = "Puzzle marked as Standard.";
                break;
            case 'upcoming':
                newFilename = `_upcoming_${baseName}${fileExt}`;
                message = "Puzzle marked as Upcoming.";
                break;
            case 'disabled':
                newFilename = `_disabled_${baseName}${fileExt}`;
                message = "Puzzle disabled.";
                break;
            case 'enabled':
                newFilename = `${baseName}${fileExt}`;
                message = "Puzzle enabled.";
                break;
            default:
                 throw new Error("Invalid status provided.");
        }
        
        const newPath = path.join(puzzlesDir, category, newFilename);
        await fs.rename(oldPath, newPath);

        revalidatePath(`/category/${category}`);
        revalidatePath('/puzzles');
        revalidatePath('/super-admin/puzzles');

        return { success: true, message, newFilename };

    } catch (error) {
        console.error('Error renaming puzzle:', error);
        return { success: false, message: 'An error occurred while updating the puzzle.', newFilename: filename };
    }
}


/**
 * Releases a new daily puzzle if it's a new day in IST.
 * This function is intended to be called from another server action
 * and includes revalidation.
 */
export async function releaseDailyPuzzle(): Promise<{ released: boolean }> {
    console.log('[SERVER ACTION] releaseDailyPuzzle');
    const dailyPuzzleCategory = 'every-day-new-puzzle';
    const db = getFirestore(app);
    const settingsRef = db.collection('settings').doc('dailyPuzzle');

    try {
        const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles', dailyPuzzleCategory);
        if (!(await fs.stat(puzzlesDir).catch(() => null))) {
            await fs.mkdir(puzzlesDir, { recursive: true });
             // Also create the category in Firestore if it doesn't exist
            const categoryDoc = await db.collection('categories').doc(dailyPuzzleCategory).get();
            if (!categoryDoc.exists) {
                await db.collection('categories').doc(dailyPuzzleCategory).set({ name: dailyPuzzleCategory, displayOrder: 0 });
            }
            return { released: false };
        }

        const files = await fs.readdir(puzzlesDir);
        const upcomingPuzzles = files
            .filter(file => file.startsWith('_upcoming_'))
            .sort();

        if (upcomingPuzzles.length === 0) {
            return { released: false };
        }

        const puzzleToRelease = upcomingPuzzles[0];
        const fileExt = path.extname(puzzleToRelease);
        const baseName = path.basename(puzzleToRelease, fileExt).replace(/^_upcoming_/, '');
        const newFilename = `_pro_${baseName}${fileExt}`;

        const oldPath = path.join(puzzlesDir, puzzleToRelease);
        const newPath = path.join(puzzlesDir, newFilename);
        await fs.rename(oldPath, newPath);

        // Update the last release date in Firestore
        const now = new Date();
        const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const istDateString = istDate.toISOString().split('T')[0];
        await settingsRef.set({ lastReleaseDate: istDateString }, { merge: true });

        revalidatePath('/puzzles');
        revalidatePath(`/category/${dailyPuzzleCategory}`);
        revalidatePath('/super-admin/puzzles');

        console.log(`Released daily puzzle: ${newFilename}`);
        return { released: true };

    } catch (error) {
        console.error('Error releasing daily puzzle:', error);
        return { released: false };
    }
}

/**
 * Checks if a new daily puzzle should be released and calls the release function.
 * This function is safe to be called from a client component's useEffect.
 */
export async function checkAndReleaseDailyPuzzle(): Promise<{ released: boolean }> {
    console.log('[SERVER ACTION] checkAndReleaseDailyPuzzle');
    const db = getFirestore(app);
    const settingsRef = db.collection('settings').doc('dailyPuzzle');

    try {
        // Get the current date in Indian Standard Time (IST)
        const now = new Date();
        const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const istDateString = istDate.toISOString().split('T')[0]; // YYYY-MM-DD

        const settingsDoc = await settingsRef.get();
        const lastReleaseDate = settingsDoc.exists ? settingsDoc.data()?.lastReleaseDate : null;

        // If a puzzle has already been released today, do nothing.
        if (lastReleaseDate === istDateString) {
            return { released: false };
        }

        // If not, trigger the release function which handles revalidation.
        return await releaseDailyPuzzle();
    } catch (error) {
        // We don't want to block the user if this fails, just log it.
        console.error('Error checking for daily puzzle release:', error);
        return { released: false };
    }
}

export type Category = {
  name: string;
  displayOrder: number;
};

// This function gets categories from Firestore and syncs with filesystem
export async function getCategories(): Promise<Category[]> {
    console.log('[SERVER ACTION] getCategories');
    const db = getFirestore(app);
    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');

    try {
        // 1. Get directories from filesystem
        const fsCategories = (await fs.readdir(puzzlesDir, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // 2. Get categories from Firestore
        const snapshot = await db.collection('categories').get();
        const firestoreCategories: Record<string, Category> = {};
        snapshot.forEach(doc => {
            firestoreCategories[doc.id] = doc.data() as Category;
        });

        // 3. Sync: Add missing filesystem categories to Firestore
        const batch = db.batch();
        let needsWrite = false;
        let maxOrder = Object.values(firestoreCategories).reduce((max, cat) => Math.max(max, cat.displayOrder), 0);

        for (const fsCat of fsCategories) {
            if (!firestoreCategories[fsCat]) {
                maxOrder++;
                const newCat = { name: fsCat, displayOrder: maxOrder };
                batch.set(db.collection('categories').doc(fsCat), newCat);
                firestoreCategories[fsCat] = newCat; // Add to our map
                needsWrite = true;
            }
        }
        if (needsWrite) {
            await batch.commit();
        }

        // 4. Return sorted categories based on what's in the filesystem
        const finalCategories = fsCategories
            .map(name => firestoreCategories[name])
            .filter(Boolean) // Filter out any potential mismatches
            .sort((a, b) => a.displayOrder - b.displayOrder);
            
        return finalCategories;
    } catch (error) {
        console.error("Error getting/syncing categories:", error);
        // If the directory doesn't exist, return empty
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

export async function updateCategoryOrders(orders: { name: string; order: number }[]): Promise<{ success: boolean; message: string }> {
    console.log('[SERVER ACTION] updateCategoryOrders');
    await verifyAdmin();
    const db = getFirestore(app);
    try {
        const batch = db.batch();
        orders.forEach(item => {
            const docRef = db.collection('categories').doc(item.name);
            batch.update(docRef, { displayOrder: item.order });
        });
        await batch.commit();
        
        revalidatePath('/puzzles');
        revalidatePath('/super-admin/puzzles');
        return { success: true, message: 'Category orders updated successfully.' };
    } catch (error) {
        console.error('Error updating category orders:', error);
        return { success: false, message: 'Failed to update category orders.' };
    }
}
