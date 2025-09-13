
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getWishlist } from '@/app/puzzles/actions';
import type { PuzzleDetails } from './actions';

export async function getWishlistDetails(userId: string): Promise<PuzzleDetails[]> {
    const wishlistIds = await getWishlist(userId);
    if (wishlistIds.length === 0) {
        return [];
    }
    
    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');
    const allPuzzles: PuzzleDetails[] = [];

    try {
        const dirents = await fs.readdir(puzzlesDir, { withFileTypes: true });
        const categories = dirents
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        const wishlistSet = new Set(wishlistIds);

        for (const category of categories) {
            const categoryDir = path.join(puzzlesDir, category);
            const files = await fs.readdir(categoryDir);
            files.forEach((file) => {
                if (wishlistSet.has(file)) {
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
