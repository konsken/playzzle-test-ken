
import HomePage from '@/components/home-page';
import { getCategories } from './actions';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import fs from 'fs/promises';
import path from 'path';

export type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};

type CategoryWithPuzzles = {
    name: string;
    displayOrder: number;
    puzzles: PuzzleImage[];
}

export type UserDataState = {
  isPro: boolean;
  unlockedPuzzleIds: string[];
  singlePurchaseCredits: { count: number; transactionIds: string[] };
  wishlist: string[];
} | null;


async function getPuzzlesForCategories(categories: {name: string, displayOrder: number}[]): Promise<CategoryWithPuzzles[]> {
    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');

    const categoriesWithPuzzles = await Promise.all(
        categories.map(async (category) => {
            let puzzles: PuzzleImage[] = [];
            try {
                const categoryDir = path.join(puzzlesDir, category.name);
                const imageFiles = (await fs.readdir(categoryDir))
                    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
                    .slice(0, 7); // Fetch up to 7 puzzles for the carousel

                puzzles = imageFiles.map((file) => ({
                    src: `/puzzles/${category.name}/${file}`,
                    category: category.name,
                    filename: file,
                    isPro: file.startsWith('_pro_'),
                    isDisabled: file.startsWith('_disabled_'),
                    isUpcoming: file.startsWith('_upcoming_'),
                }));

            } catch (error) {
                // If a category folder doesn't exist, it's fine. It will just have no puzzles.
                // console.error(`Could not read puzzles for category ${category.name}:`, error);
            }
            
            return {
                ...category,
                puzzles,
            };
        })
    );

    return categoriesWithPuzzles;
}


export default async function PuzzlesPage() {
  const [user, categories] = await Promise.all([
      getAuthenticatedUser(),
      getCategories()
  ]);
  const isSuperAdmin = !!user?.customClaims?.superadmin;
  
  const categoriesWithPuzzles = await getPuzzlesForCategories(categories);

  const userData: UserDataState = user ? {
    isPro: user.isPro,
    unlockedPuzzleIds: user.unlockedPuzzleIds,
    singlePurchaseCredits: user.singlePurchaseCredits,
    wishlist: user.wishlist,
  } : null;

  return (
    <HomePage 
        categories={categoriesWithPuzzles} 
        isSuperAdmin={isSuperAdmin} 
        user={user} 
        initialUserData={userData}
    />
  );
}
    
