
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
  } from "@/components/ui/dialog"
import { Eye, EyeOff, Puzzle, TimerIcon, ArrowLeft, Smartphone, Play, Pause, XCircle } from 'lucide-react';
import PiczzleGame from '@/components/piczzle-game';
import JigsawGame from '@/components/jigsaw-game';
import Link from 'next/link';

const JIGSAW_DIFFICULTY_LEVELS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const SLIDE_DIFFICULTY_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10];


type PuzzleType = 'slide' | 'jigsaw';

type DynamicPuzzleGameProps = {
  imageSrc: string;
  slug: string;
  imageFilename: string;
  mobilePlayEnabled: boolean;
};

export type GameActionsHandle = {
  start: () => void;
  stop: () => void;
  pause: () => void;
  restart: () => void;
};


export default function DynamicPuzzleGame({ imageSrc, slug, imageFilename, mobilePlayEnabled }: DynamicPuzzleGameProps) {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('jigsaw');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [gameStats, setGameStats] = useState({ moves: 0, time: '00:00' });
  const [gameState, setGameState] = useState<'initial' | 'playing' | 'paused' | 'solved' | 'ready'>('initial');
  const [difficulty, setDifficulty] = useState(puzzleType === 'jigsaw' ? 4 : 3);
  
  const [isMobile, setIsMobile] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const gameActionsRef = useRef<GameActionsHandle>(null);

  useEffect(() => {
    // Client-side check for mobile
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile && !mobilePlayEnabled) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-muted/20 dark:bg-transparent">
        <Smartphone className="w-20 h-20 mb-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Game Not Supported on Mobile</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          For the best experience, please play this puzzle game on a desktop or tablet device. The site administrator has currently disabled mobile play.
        </p>
        <Button asChild>
          <Link href="/puzzles">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Puzzles
          </Link>
        </Button>
      </div>
    );
  }

  const handleDifficultyChange = (value: string) => {
    setDifficulty(Number(value));
  };
  
  const handlePuzzleTypeChange = (value: PuzzleType) => {
    setPuzzleType(value);
    // Reset difficulty to default for the new type
    setDifficulty(value === 'jigsaw' ? 4 : 3);
  }
  
  const handleStartFromModal = () => {
      gameActionsRef.current?.start();
      setIsConfigOpen(false);
  }
  
  const difficultyLevels = puzzleType === 'jigsaw' ? JIGSAW_DIFFICULTY_LEVELS : SLIDE_DIFFICULTY_LEVELS;

  return (
    <div className="w-full h-full flex flex-col bg-muted/20 dark:bg-transparent">
        {/* Header */}
         <div className="flex items-center justify-between p-2 md:p-4 border-b bg-card">
            <Button variant="outline" size="icon" asChild>
                <Link href="/puzzles">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sr-only">Back to puzzles</span>
                </Link>
            </Button>
            
            <div className="flex-grow flex justify-center items-center gap-4 md:gap-8 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                    <Puzzle className="w-4 h-4 text-muted-foreground" />
                    <span>Moves: {gameStats.moves}</span>
                </div>
                
                <div className="flex items-center gap-2">
                     <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                        <DialogTrigger asChild>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 rounded-full"
                                onClick={() => {
                                    if(gameState === 'playing' || gameState === 'paused') {
                                        gameActionsRef.current?.pause();
                                    } else {
                                        setIsConfigOpen(true);
                                    }
                                }}
                                aria-label={gameState === 'playing' ? 'Pause game' : 'Play game'}
                            >
                                {gameState === 'playing' ? (
                                    <Pause className="w-8 h-8" />
                                ) : (
                                    <Play className="w-8 h-8" />
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Game Setup</DialogTitle>
                                <DialogDescription>
                                    Choose your game type and difficulty to start the puzzle.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Game Type</Label>
                                    <Select value={puzzleType} onValueChange={handlePuzzleTypeChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="jigsaw">Jigsaw</SelectItem>
                                            <SelectItem value="slide">Slide</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select value={String(difficulty)} onValueChange={handleDifficultyChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {difficultyLevels.map(level => (
                                                <SelectItem key={level} value={String(level)}>
                                                    {level} x {level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                    Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="button" onClick={handleStartFromModal}>
                                    Start Puzzle
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {(gameState === 'playing' || gameState === 'paused') && (
                         <Button
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => gameActionsRef.current?.stop()}
                            aria-label="Stop game"
                        >
                            <XCircle className="w-6 h-6" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <TimerIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Time: {gameStats.time}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPreviewVisible(v => !v)}
                    >
                    {isPreviewVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
            </div>
        </div>
        
        {/* Game Area */}
        <div className="w-full flex-grow flex flex-col relative">
            {puzzleType === 'slide' && imageSrc && (
                <PiczzleGame 
                    ref={gameActionsRef}
                    imageSrcFromHome={imageSrc} 
                    isPreviewVisibleFromHome={isPreviewVisible}
                    onStatsChange={setGameStats}
                    slug={slug}
                    imageFilename={imageFilename}
                    gridSizeFromHome={difficulty}
                    onGameStateChange={setGameState}
                />
            )}
            {puzzleType === 'jigsaw' && imageSrc && (
                <JigsawGame 
                    ref={gameActionsRef}
                    imageSrcFromHome={imageSrc} 
                    isPreviewVisibleFromHome={isPreviewVisible}
                    onStatsChange={setGameStats}
                    slug={slug}
                    imageFilename={imageFilename}
                    gridSizeFromHome={difficulty}
                    onGameStateChange={setGameState}
                />
            )}
        </div>
      </div>
  );
}
