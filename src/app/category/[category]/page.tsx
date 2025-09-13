
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { PuzzlesGrid } from './puzzles-grid';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { getSinglePuzzleCredits, getUserProStatus, getUnlockedPuzzles, getWishlist } from '@/app/account/actions';
import type { UserDataState } from '@/app/puzzles/page';

type CategoryPageProps = {
    params: {
        category: string;
    }
}

type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};


function formatCategoryName(name: string) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

async function getPuzzlesForCategory(category: string, isSuperAdmin: boolean): Promise<PuzzleImage[]> {
    try {
        const categoryDir = path.join(process.cwd(), 'public', 'puzzles', category);

        if (!fs.existsSync(categoryDir) || !fs.statSync(categoryDir).isDirectory()) {
            return [];
        }

        let imageFiles = fs.readdirSync(categoryDir).filter(file =>
            /\.(jpg|jpeg|png|webp)$/i.test(file)
        );
        
        if (!isSuperAdmin) {
            imageFiles = imageFiles.filter(file => !file.startsWith('_disabled_'));
        }

        const images: PuzzleImage[] = imageFiles.map((file) => ({
            src: `/puzzles/${category}/${file}`,
            category: category,
            filename: file,
            isPro: file.startsWith('_pro_'),
            isDisabled: file.startsWith('_disabled_'),
            isUpcoming: file.startsWith('_upcoming_'),
        }));
        
        return images;

    } catch (error) {
        console.error('Error fetching puzzles for category:', error);
        return [];
    }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { category } = params;
    const decodedCategory = decodeURIComponent(category);
    
    const user = await getAuthenticatedUser();
    const isSuperAdmin = !!user?.customClaims?.superadmin;
    
    // Fetch all user data ONCE on the server
    const [puzzles, proStatus, unlocked, credits, wish] = await Promise.all([
        getPuzzlesForCategory(decodedCategory, isSuperAdmin),
        user ? getUserProStatus(user.uid) : Promise.resolve({ isPro: false }),
        user ? getUnlockedPuzzles(user.uid) : Promise.resolve([]),
        user ? getSinglePuzzleCredits(user.uid) : Promise.resolve({ count: 0, transactionIds: [] }),
        user ? getWishlist(user.uid) : Promise.resolve([])
    ]);

    if (puzzles.length === 0 && !isSuperAdmin) {
        const categoryDir = path.join(process.cwd(), 'public', 'puzzles', decodedCategory);
        if (!fs.existsSync(categoryDir) || !fs.statSync(categoryDir).isDirectory()) {
            notFound();
        }
    }
    
    // Pass all user data as props to the client component
    const userData: UserDataState = user ? {
        isPro: proStatus.isPro,
        unlockedPuzzleIds: unlocked,
        singlePurchaseCredits: credits,
        wishlist: wish,
    } : null;
    
  return (
    <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 capitalize">{formatCategoryName(decodedCategory)}</h1>
        <PuzzlesGrid 
            initialPuzzles={puzzles} 
            user={user}
            isSuperAdmin={isSuperAdmin}
            initialUserData={userData}
        />
    </div>
  );
}

    