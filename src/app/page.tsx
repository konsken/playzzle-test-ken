
import { Button } from '@/components/ui/button';
import { ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { LogoIcon } from '@/components/icons/logo';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { getSiteSettings } from './super-admin/settings/actions';
import { cn } from '@/lib/utils';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { WelcomeClient } from './welcome-client';

type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
};

// This is now only used for the floating background images
const getRandomPuzzles = async (count: number): Promise<PuzzleImage[]> => {
    const puzzlesDir = path.join(process.cwd(), 'public', 'puzzles');
    const allPuzzles: PuzzleImage[] = [];

    try {
        const dirents = await fs.readdir(puzzlesDir, { withFileTypes: true });
        const categories = dirents
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        for (const category of categories) {
            const categoryDir = path.join(puzzlesDir, category);
            const imageFiles = (await fs.readdir(categoryDir)).filter(file =>
                /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.toLowerCase().includes('_pro')
            );
            imageFiles.forEach((file) => {
                allPuzzles.push({
                    src: `/puzzles/${category}/${file}`,
                    category,
                    filename: file,
                });
            });
        }

        const shuffled = allPuzzles.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);

    } catch (error) {
        console.error("Could not read puzzles directory:", error);
        return [];
    }
};


export default async function WelcomePage() {
    const randomPuzzles = await getRandomPuzzles(6);
    const { offerEnabled, offerTitle, offerDescription, offerShopNowText } = await getSiteSettings();
    const user = await getAuthenticatedUser();

    // Define positions for the cards
    const cardPositions = [
        { top: '15%', left: '5%', rotation: '-8deg', duration: '12s' },
        { bottom: '10%', left: '7%', rotation: '10deg', duration: '10s', delay: '2s'},
        { top: '30%', left: '20%', rotation: '3deg', duration: '14s', delay: '4s' },
        { top: '15%', right: '10%', rotation: '5deg', duration: '15s', delay: '1s' },
        { bottom: '10%', right: '20%', rotation: '-3deg', duration: '18s', delay: '3s' },
        { top: '55%', right: '5%', rotation: '8deg', duration: '16s', delay: '5s' },
    ];

    return (
        <div className="dotted-background relative flex flex-col items-center justify-center text-center py-24 px-4 h-full overflow-hidden">
            {/* Background animated puzzle cards */}
            <div className="absolute inset-0 w-full h-full z-0">
                {randomPuzzles.map((puzzle, index) => (
                    <div
                        key={puzzle.src}
                        className="absolute hidden md:block"
                        style={{
                            ...cardPositions[index % cardPositions.length],
                            animation: `float ${cardPositions[index % cardPositions.length].duration} ease-in-out infinite`,
                            animationDelay: cardPositions[index % cardPositions.length].delay,
                        }}
                    >
                         <Card className="overflow-hidden shadow-2xl">
                            <CardContent className="p-0">
                                 <div className="relative" style={{ width: '150px', height: '200px' }}>
                                    <Image
                                        src={puzzle.src}
                                        alt={`Puzzle thumbnail ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="150px"
                                    />
                                    <div className="absolute inset-0 bg-black/20 pointer-events-none">
                                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                            <defs>
                                                <pattern id="puzzle-pattern-welcome" patternUnits="userSpaceOnUse" width="100" height="100">
                                                    <path d="M50 0 v20 a15 15 0 0 0 0 30 v20 a15 15 0 0 1 0 30 v20 M0 50 h20 a15 15 0 0 1 30 0 h20 a15 15 0 0 0 30 0 h20"
                                                        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill="url(#puzzle-pattern-welcome)" />
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>


            <div className="relative z-10 bg-background/50 backdrop-blur-sm p-8 rounded-lg">
                <div className="mb-8">
                    <LogoIcon className="w-24 h-24 mx-auto text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Playzzle!</h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    The ultimate destination to create and solve beautiful jigsaw puzzles from any image.
                    Challenge your mind, relax, and have fun.
                </p>
                <WelcomeClient 
                    user={user} 
                    offerEnabled={offerEnabled}
                    offerTitle={offerTitle}
                    offerDescription={offerDescription}
                    offerShopNowText={offerShopNowText}
                />
            </div>
        </div>
    );
}
