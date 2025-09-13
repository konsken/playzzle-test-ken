

import { getUnlockedPuzzleDetails } from './unlocked-puzzles-details';
import type { PuzzleDetails } from './actions';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export async function UnlockedPuzzles({ userId }: { userId: string }) {
    const puzzles = await getUnlockedPuzzleDetails(userId);

    if (puzzles.length === 0) {
        return <p className="text-muted-foreground">You have not unlocked any individual pro puzzles yet.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {puzzles.map((puzzle, index) => (
                <Link key={index} href={`/play/${puzzle.category}/${encodeURIComponent(puzzle.filename)}`}>
                    <Card className="overflow-hidden relative group">
                        <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Unlocked
                        </Badge>
                        <CardContent className="p-0">
                            <div className="aspect-[3/4] relative">
                                <Image
                                src={puzzle.src}
                                alt={`Unlocked Puzzle ${index + 1}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                />
                                <div className="absolute inset-0 bg-black/20 pointer-events-none">
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id={`unlocked-puzzle-pattern-${index}`} patternUnits="userSpaceOnUse" width="100" height="100">
                                                <path d="M50 0 v20 a15 15 0 0 0 0 30 v20 a15 15 0 0 1 0 30 v20 M0 50 h20 a15 15 0 0 1 30 0 h20 a15 15 0 0 0 30 0 h20"
                                                    fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill={`url(#unlocked-puzzle-pattern-${index})`} />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
