
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getSolvedPuzzleHistory, type GroupedSolvedPuzzle, type SolvedAttempt, GetSolvedPuzzlesResult } from './actions';
import { Clock, Gamepad2, Puzzle, AlertTriangle, Loader2, Trophy, Eye, Play } from 'lucide-react';
import { getSiteSettings, type SiteSettings } from '@/app/super-admin/settings/actions';
import { getPuzzleDisplayName } from '@/lib/name-formatter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaginationControls } from '@/components/pagination-controls';


function formatTime(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

function PuzzleHistoryCard({ puzzle, puzzleName }: { puzzle: GroupedSolvedPuzzle, puzzleName: string }) {

    return (
        <Dialog>
            <Card className="overflow-hidden group flex flex-col border-dotted border-2 border-amber-500/50 hover:border-amber-500 transition-colors shadow-lg shadow-amber-500/10">
                <DialogTrigger asChild>
                     <div className="relative cursor-pointer">
                        <div className="aspect-[3/4] relative">
                             <Image
                                src={puzzle.src}
                                alt={`Solved Puzzle ${puzzle.filename}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/20 pointer-events-none">
                                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <pattern id={`solved-puzzle-pattern-${puzzle.puzzleSlug.replace(/[^a-zA-Z0-9-]/g, '')}`} patternUnits="userSpaceOnUse" width="100" height="100">
                                            <path d="M50 0 v20 a15 15 0 0 0 0 30 v20 a15 15 0 0 1 0 30 v20 M0 50 h20 a15 15 0 0 1 30 0 h20 a15 15 0 0 0 30 0 h20"
                                                fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill={`url(#solved-puzzle-pattern-${puzzle.puzzleSlug.replace(/[^a-zA-Z0-9-]/g, '')})`} />
                                </svg>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-3 text-white w-full">
                            <h3 className="font-bold text-lg capitalize truncate">{puzzleName}</h3>
                            <p className="text-sm opacity-80">{puzzle.attempts.length} best attempt(s)</p>
                        </div>
                         <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-amber-500 text-white">
                            <Trophy className="w-3 h-3 mr-1" />
                            Solved
                        </Badge>
                    </div>
                </DialogTrigger>
                 <CardContent className="p-3 mt-auto bg-muted/50">
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2"/>
                            View Details
                        </Button>
                    </DialogTrigger>
                </CardContent>
            </Card>

            <DialogContent className="max-w-2xl">
                 <DialogHeader>
                    <DialogTitle className="capitalize">{puzzleName}</DialogTitle>
                    <DialogDescription>
                        Your best performance for each difficulty on this puzzle.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid md:grid-cols-[1fr_2fr] gap-6 py-4">
                     <div className="aspect-[3/4] relative rounded-md overflow-hidden">
                        <Image
                            src={puzzle.src}
                            alt={`Solved Puzzle ${puzzle.filename}`}
                            fill
                            className="object-cover"
                            sizes="33vw"
                        />
                         <div className="absolute inset-0 bg-black/20 pointer-events-none">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id={`solved-modal-pattern-${puzzle.puzzleSlug.replace(/[^a-zA-Z0-9-]/g, '')}`} patternUnits="userSpaceOnUse" width="100" height="100">
                                        <path d="M50 0 v20 a15 15 0 0 0 0 30 v20 a15 15 0 0 1 0 30 v20 M0 50 h20 a15 15 0 0 1 30 0 h20 a15 15 0 0 0 30 0 h20"
                                            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#solved-modal-pattern-${puzzle.puzzleSlug.replace(/[^a-zA-Z0-9-]/g, '')})`} />
                            </svg>
                        </div>
                    </div>
                    <ScrollArea className="h-[250px] pr-3">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Difficulty</TableHead>
                                    <TableHead>Best Time</TableHead>
                                    <TableHead>Moves</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {puzzle.attempts.sort((a,b) => b.difficulty - a.difficulty).map((attempt) => (
                                    <TableRow key={attempt.id}>
                                        <TableCell className="font-medium capitalize">
                                            <div className="flex items-center gap-2">
                                                <Puzzle className="w-4 h-4 text-muted-foreground"/>
                                                <span>{attempt.difficulty}x{attempt.difficulty} ({attempt.gameType})</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>{formatTime(attempt.timeInSeconds)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                                                <span>{attempt.moves}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 </div>
                 <div className="pt-4">
                    <Button asChild className="w-full">
                        <Link href={`/play/${puzzle.category}/${encodeURIComponent(puzzle.filename)}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Play Again
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

type SolvedPuzzlesProps = {
    initialPuzzles: GroupedSolvedPuzzle[];
    error?: { code: string, message: string };
};

export function SolvedPuzzles({ initialPuzzles, error }: SolvedPuzzlesProps) {
    const [allPuzzles] = useState<GroupedSolvedPuzzle[]>(initialPuzzles);
    const [filteredPuzzles, setFilteredPuzzles] = useState<GroupedSolvedPuzzle[]>([]);
    const [displayedPuzzles, setDisplayedPuzzles] = useState<GroupedSolvedPuzzle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('latest');
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const puzzlesPerPage = 12;
    
    useEffect(() => {
        getSiteSettings().then(settingsResult => {
            setSiteSettings(settingsResult);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        let filtered = allPuzzles;

        if (categoryFilter !== 'all') {
            filtered = allPuzzles.filter(p => p.category === categoryFilter);
        }
        
        const sorted = [...filtered].sort((a, b) => {
            if (sortOrder === 'most-played') {
                return b.attempts.length - a.attempts.length;
            }
            const dateA = new Date(a.lastCompleted).getTime();
            const dateB = new Date(b.lastCompleted).getTime();
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredPuzzles(sorted);
        setCurrentPage(1); // Reset to page 1 on filter change

    }, [categoryFilter, sortOrder, allPuzzles]);
    
    useEffect(() => {
        const startIndex = (currentPage - 1) * puzzlesPerPage;
        const endIndex = startIndex + puzzlesPerPage;
        setDisplayedPuzzles(filteredPuzzles.slice(startIndex, endIndex));
    }, [currentPage, filteredPuzzles]);
    

    const categories = ['all', ...Array.from(new Set(allPuzzles.map(p => p.category)))];
    const totalPages = Math.ceil(filteredPuzzles.length / puzzlesPerPage);

    if (isLoading || !siteSettings) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    
    if (error) {
         if (error.code === 'FAILED_PRECONDITION') {
            const urlMatch = error.message.match(/https?:\/\/[^\s]+/);
            const firestoreIndexUrl = urlMatch ? urlMatch[0] : '#';

            return (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Database Index Required</AlertTitle>
                    <AlertDescription>
                        A database index is needed to show your solved puzzles. Please visit the link below to create it, then wait a few minutes and refresh this page.
                        <a 
                            href={firestoreIndexUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-2 block break-all text-xs font-mono underline bg-destructive-foreground/10 p-2 rounded-md"
                        >
                          {firestoreIndexUrl}
                        </a>
                    </AlertDescription>
                </Alert>
            )
        }
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading History</AlertTitle>
                <AlertDescription>Could not load your solved puzzles. Please try again later.</AlertDescription>
            </Alert>
        );
    }

    if (allPuzzles.length === 0) {
        return <p className="text-muted-foreground">You have not solved any puzzles yet. Go play some!</p>;
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-4 mb-6">
                 <div className="flex items-center gap-2">
                    <Label htmlFor="category-filter" className="text-sm font-medium">Category:</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger id="category-filter" className="w-[180px]">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2">
                    <Label htmlFor="sort-order" className="text-sm font-medium">Sort by:</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger id="sort-order" className="w-[180px]">
                            <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">Latest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="most-played">Most Played</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayedPuzzles.map((puzzle) => {
                    const puzzleName = getPuzzleDisplayName(puzzle.filename, siteSettings.puzzleNameDisplay, siteSettings.puzzleGenericName);
                    return <PuzzleHistoryCard key={puzzle.puzzleSlug} puzzle={puzzle} puzzleName={puzzleName} />
                })}
            </div>
            
            {filteredPuzzles.length === 0 ? (
                <p className="text-muted-foreground mt-4">No solved puzzles match your filters.</p>
            ) : totalPages > 1 && (
                <div className="mt-8">
                     <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
