
// src/app/api/puzzles/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const user = await getAuthenticatedUser();
  const isSuperAdmin = !!user?.customClaims?.superadmin;

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    const decodedCategory = decodeURIComponent(category);
    const categoryDir = path.join(process.cwd(), 'public', 'puzzles', decodedCategory);

    if (!fs.existsSync(categoryDir) || !fs.statSync(categoryDir).isDirectory()) {
      return NextResponse.json([]);
    }

    let imageFiles = fs.readdirSync(categoryDir).filter(file =>
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );
    
    // Admins see all files. Regular users do not see disabled files.
    // Upcoming files are now visible to everyone.
    if (!isSuperAdmin) {
        imageFiles = imageFiles.filter(file => !file.startsWith('_disabled_'));
    }

    const images: PuzzleImage[] = imageFiles.map((file) => ({
      src: `/puzzles/${decodedCategory}/${file}`,
      category: decodedCategory,
      filename: file,
      isPro: file.startsWith('_pro_'),
      isDisabled: file.startsWith('_disabled_'),
      isUpcoming: file.startsWith('_upcoming_'),
    }));
    
    return NextResponse.json(images);

  } catch (error) {
    console.error('API Error fetching puzzles:', error);
    return NextResponse.json({ error: 'Failed to fetch puzzles' }, { status: 500 });
  }
}
