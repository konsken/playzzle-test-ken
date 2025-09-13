
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { PuzzleDetails } from './actions';

export async function getUnlockedPuzzleDetails(userId: string): Promise<PuzzleDetails[]> {
    const user = await getAuthenticatedUser();
    // Use the authenticated user's data directly
    const unlockedIds = user?.uid === userId ? user.unlockedPuzzleIds : [];

    if (unlockedIds.length === 0) {
        return [];
    }

    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');
    const allPuzzles: PuzzleDetails[] = [];

     try {
        const dirents = await fs.readdir(puzzlesDir, { withFileTypes: true });
        const categories = dirents
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        const unlockedSet = new Set(unlockedIds);

        for (const category of categories) {
            const categoryDir = path.join(puzzlesDir, category);
            const files = await fs.readdir(categoryDir);
            files.forEach((file) => {
                 if (unlockedSet.has(file)) {
                    allPuzzles.push({
                        src: `/puzzles/${category}/${file}`,
                        category,
                        filename: file,
                    });
                 }
            });
        }

        return allPuzzles;

    } catch (error) {
        console.error("Could not read puzzles directory:", error);
        return [];
    }
}
