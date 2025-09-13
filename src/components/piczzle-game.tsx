
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  } from "@/components/ui/dialog"
import { Upload, Puzzle, ImageIcon, TimerIcon, Sparkles, Play, Pause, XCircle, Star, Eye, EyeOff, Move, CornerDownRight } from 'lucide-react';
import { useTimer } from '@/hooks/use-timer';
import { useBestTime } from '@/hooks/use-best-time';
import ShareButton from './share-button';
import { recordGameCompletion } from '@/app/dashboard/actions';
import type { GameActionsHandle } from './dynamic-puzzle-game';


const GRID_SIZES = [3, 4, 5, 6, 7, 8, 9, 10];

type GameState = 'initial' | 'ready' | 'playing' | 'paused' | 'solved';


const motivationalMessages = [
    "You're a puzzle-solving superhero!",
    "Incredible! Your brain is a superpower!",
    "You've conquered the challenge like a true champion!",
    "Brilliant! You've got the mind of a genius!",
];

type PiczzleGameProps = {
    imageSrcFromHome?: string;
    isPreviewVisibleFromHome?: boolean;
    onStatsChange?: (stats: { moves: number; time: string }) => void;
    slug?: string;
    imageFilename?: string;
    gridSizeFromHome?: number;
    onGameStateChange?: (state: GameState) => void;
};

const PiczzleGame = forwardRef<GameActionsHandle, PiczzleGameProps>(({ 
    imageSrcFromHome, 
    isPreviewVisibleFromHome, 
    onStatsChange, 
    slug, 
    imageFilename,
    gridSizeFromHome,
    onGameStateChange,
}, ref) => {
    const [gridSize, setGridSize] = useState(gridSizeFromHome || 3);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [pieces, setPieces] = useState<number[]>([]);
    const [showGuide, setShowGuide] = useState(false);
    const [moves, setMoves] = useState(0);
    const { time, seconds: timeInSeconds, isActive, startTimer, pauseTimer, stopTimer, resetTimer } = useTimer();
    const { bestTime, updateBestTime } = useBestTime('slide', gridSize);
    const [puzzleDimension, setPuzzleDimension] = useState({ width: 500, height: 500 });
    const [motivationalMessage, setMotivationalMessage] = useState("");
    const [gameState, setGameState] = useState<GameState>('initial');
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);
    const hasRecordedCompletion = useRef(false);

    const [previewPos, setPreviewPos] = useState({ x: 20, y: 80 });
    const [isDraggingPreview, setIsDraggingPreview] = useState(false);
    const [isResizingPreview, setIsResizingPreview] = useState(false);
    const [previewSize, setPreviewSize] = useState({ width: 192 });
    const previewRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, startWidth: 0 });
    
    const puzzleContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (onStatsChange) {
            onStatsChange({ moves, time });
        }
    }, [moves, time, onStatsChange]);

    useEffect(() => {
        if(onGameStateChange) {
            onGameStateChange(gameState);
        }
    }, [gameState, onGameStateChange]);
    
    useEffect(() => {
        if (gridSizeFromHome !== undefined) {
            setGridSize(gridSizeFromHome);
        }
    }, [gridSizeFromHome]);
    
    useEffect(() => {
        if (isPreviewVisibleFromHome !== undefined) {
            setIsPreviewVisible(isPreviewVisibleFromHome);
        }
    }, [isPreviewVisibleFromHome]);

    const pieceWidth = puzzleDimension.width / gridSize;
    const pieceHeight = puzzleDimension.height / gridSize;
    const emptyPiece = gridSize * gridSize;
    
    const updatePuzzleSize = useCallback(() => {
      if (puzzleContainerRef.current && imageSize.width > 0) {
        const containerWidth = puzzleContainerRef.current.offsetWidth * 0.9;
        const containerHeight = puzzleContainerRef.current.offsetHeight * 0.9;
        
        const imageAspectRatio = imageSize.width / imageSize.height;

        let newWidth = containerWidth;
        let newHeight = newWidth / imageAspectRatio;

        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = newHeight * imageAspectRatio;
        }
        
        setPuzzleDimension({ width: newWidth, height: newHeight });
        return { width: newWidth, height: newHeight };
      }
      return null;
    }, [imageSize.width, imageSize.height]);


    const isSolvable = useCallback((arr: number[]): boolean => {
        let inversions = 0;
        const filteredArr = arr.filter(p => p !== emptyPiece);
        for (let i = 0; i < filteredArr.length - 1; i++) {
            for (let j = i + 1; j < filteredArr.length; j++) {
                if (filteredArr[i] > filteredArr[j]) {
                    inversions++;
                }
            }
        }

        if (gridSize % 2 === 1) {
            return inversions % 2 === 0;
        } else {
            const emptyRow = Math.floor(arr.indexOf(emptyPiece) / gridSize);
            return (inversions + emptyRow) % 2 === 1;
        }
    }, [gridSize, emptyPiece]);

    const getSolvedState = useCallback(() => {
        const totalPieces = gridSize * gridSize;
        const solved = Array.from({ length: totalPieces }, (_, i) => i + 1);
        return solved.map(p => p === totalPieces ? emptyPiece : p);
    }, [gridSize, emptyPiece]);

    const setupPuzzle = useCallback(() => {
        if (!imageSrc || !imageSize.width || !puzzleContainerRef.current) return;
        updatePuzzleSize();
        const solvedState = getSolvedState();
        setPieces(solvedState);
        setMoves(0);
        resetTimer();
        setGameState('ready');
        hasRecordedCompletion.current = false;
    }, [getSolvedState, updatePuzzleSize, resetTimer, imageSrc, imageSize.width]);
    
    const startGame = useCallback(() => {
        if (!imageSrc || !imageSize.width || !puzzleContainerRef.current) return;
        updatePuzzleSize();
        const solvedState = getSolvedState();
        
        let shuffled;
        do {
            shuffled = [...solvedState].sort(() => Math.random() - 0.5);
        } while (!isSolvable(shuffled));
        
        setPieces(shuffled);
        setMoves(0);
        resetTimer();
        startTimer();
        setGameState('playing');
        hasRecordedCompletion.current = false;
    }, [getSolvedState, isSolvable, resetTimer, startTimer, imageSrc, imageSize.width, updatePuzzleSize]);

    const stopGame = useCallback(() => {
        stopTimer();
        setupPuzzle();
    }, [stopTimer, setupPuzzle]);
    
    const handlePause = useCallback(() => {
        if (gameState === 'playing') {
            pauseTimer();
            setGameState('paused');
        } else if (gameState === 'paused') {
            startTimer();
            setGameState('playing');
        }
    }, [gameState, pauseTimer, startTimer]);

    useImperativeHandle(ref, () => ({
        start: startGame,
        stop: stopGame,
        pause: handlePause,
        restart: startGame,
    }));
    
    useEffect(() => {
      if (imageSrcFromHome) {
        const img = new Image();
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setImageSrc(imageSrcFromHome);
        };
        img.src = imageSrcFromHome;
      }
    }, [imageSrcFromHome]);

    useEffect(() => {
        if (imageSrc && imageSize.width > 0 && puzzleContainerRef.current) {
            setupPuzzle();
        }
    }, [gridSize, imageSrc, imageSize.width, setupPuzzle]);

    useEffect(() => {
      const handleResize = () => {
        if (imageSrc && imageSize.width > 0 && puzzleContainerRef.current) {
          setupPuzzle();
        }
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [imageSrc, imageSize.width, setupPuzzle]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                const img = new Image();
                img.onload = () => {
                    setImageSize({ width: img.width, height: img.height });
                    setImageSrc(result);
                };
                img.src = result;
            };
            reader.readAsDataURL(file);
        }
    };

    const checkSolved = useCallback((currentPieces: number[]) => {
        const solvedState = getSolvedState();
        for (let i = 0; i < currentPieces.length; i++) {
            if (currentPieces[i] !== solvedState[i]) {
                return false;
            }
        }
        return true;
    }, [getSolvedState]);
    
    useEffect(() => {
        if (gameState === 'playing' && checkSolved(pieces) && !hasRecordedCompletion.current) {
            hasRecordedCompletion.current = true; // Set flag immediately
            setGameState('solved');
            stopTimer();
            updateBestTime(timeInSeconds);
            setMotivationalMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
            if (slug && imageFilename) {
                recordGameCompletion({
                    puzzleSlug: slug,
                    category: slug.split('/')[0],
                    gameType: 'slide',
                    difficulty: gridSize,
                    timeInSeconds: timeInSeconds,
                    moves: moves,
                });
            }
        }
    }, [pieces, gameState, checkSolved, stopTimer, updateBestTime, timeInSeconds, slug, imageFilename, gridSize, moves]);

    const handlePieceClick = (clickedIndex: number) => {
        if (gameState !== 'playing') return;

        const emptyIndex = pieces.indexOf(emptyPiece);
        const { row: clickedRow, col: clickedCol } = { row: Math.floor(clickedIndex / gridSize), col: clickedIndex % gridSize };
        const { row: emptyRow, col: emptyCol } = { row: Math.floor(emptyIndex / gridSize), col: emptyIndex % gridSize };
        
        const isAdjacent = (Math.abs(clickedRow - emptyRow) + Math.abs(clickedCol - emptyCol)) === 1;

        if (isAdjacent) {
            const newPieces = [...pieces];
            [newPieces[clickedIndex], newPieces[emptyIndex]] = [newPieces[emptyIndex], newPieces[clickedIndex]];
            setPieces(newPieces);
            const newMoves = moves + 1;
            setMoves(newMoves);
        }
    };
    
    const handleDialogClose = () => {
        setupPuzzle();
    }

    const puzzlePieces = useMemo(() => {
      if (!imageSrc || puzzleDimension.width === 0) return null;
      return pieces.map((pieceValue, index) => {
        if (pieceValue === emptyPiece && gameState === 'playing') return null;
        
        const pieceId = pieceValue === emptyPiece ? (gridSize * gridSize) : pieceValue;
        const originalIndex = pieceId - 1;

        const originalRow = Math.floor(originalIndex / gridSize);
        const originalCol = originalIndex % gridSize;

        const currentRow = Math.floor(index / gridSize);
        const currentCol = index % gridSize;

        return (
            <div
                key={pieceValue}
                onClick={() => handlePieceClick(index)}
                onTouchStart={() => handlePieceClick(index)}
                className="absolute border border-background/20 rounded-md shadow-md cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 hover:z-10"
                style={{
                    width: pieceWidth,
                    height: pieceHeight,
                    transform: `translate(${currentCol * pieceWidth}px, ${currentRow * pieceHeight}px)`,
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: `${puzzleDimension.width}px ${puzzleDimension.height}px`,
                    backgroundPosition: `-${originalCol * pieceWidth}px -${originalRow * pieceHeight}px`,
                    willChange: 'transform',
                }}
            />
        );
      });
    }, [pieces, gridSize, imageSrc, pieceWidth, pieceHeight, puzzleDimension.width, puzzleDimension.height, gameState, emptyPiece, handlePieceClick]);


    const handlePreviewMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!previewRef.current || isResizingPreview) return;
        
        e.preventDefault(); // Prevent text selection etc.
        setIsDraggingPreview(true);
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const rect = previewRef.current.getBoundingClientRect();
        dragOffsetRef.current = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
        previewRef.current.style.transition = 'none';
    };

    const handlePreviewResizeMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizingPreview(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        resizeStartRef.current = {
            x: clientX,
            startWidth: previewRef.current?.offsetWidth || previewSize.width,
        };
    };

    const handlePreviewMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!previewRef.current) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        if (isDraggingPreview && puzzleContainerRef.current) {
            const parentRect = puzzleContainerRef.current.getBoundingClientRect();
            previewRef.current.style.left = `${clientX - parentRect.left - dragOffsetRef.current.x}px`;
            previewRef.current.style.top = `${clientY - parentRect.top - dragOffsetRef.current.y}px`;

        } else if (isResizingPreview) {
            const dx = clientX - resizeStartRef.current.x;
            const newWidth = resizeStartRef.current.startWidth + dx;
            previewRef.current.style.width = `${Math.max(100, newWidth)}px`;
        }
    }, [isDraggingPreview, isResizingPreview]);
    
    const handlePreviewMouseUp = useCallback(() => {
        if (previewRef.current) {
            previewRef.current.style.transition = 'all 0.2s';
            if (isDraggingPreview) {
                setPreviewPos({
                    x: previewRef.current.offsetLeft,
                    y: previewRef.current.offsetTop,
                });
            }
            if (isResizingPreview) {
                setPreviewSize({
                    width: previewRef.current.offsetWidth
                });
            }
        }
        setIsDraggingPreview(false);
        setIsResizingPreview(false);
    }, [isDraggingPreview, isResizingPreview]);

    useEffect(() => {
        document.addEventListener('mousemove', handlePreviewMouseMove);
        document.addEventListener('mouseup', handlePreviewMouseUp);
        document.addEventListener('touchmove', handlePreviewMouseMove);
        document.addEventListener('touchend', handlePreviewMouseUp);
        return () => {
            document.removeEventListener('mousemove', handlePreviewMouseMove);
            document.removeEventListener('mouseup', handlePreviewMouseUp);
            document.removeEventListener('touchmove', handlePreviewMouseMove);
            document.removeEventListener('touchend', handlePreviewMouseUp);
        };
    }, [handlePreviewMouseMove, handlePreviewMouseUp]);

    const showControls = !imageSrcFromHome;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full flex-grow flex flex-col lg:flex-row gap-8">
                {showControls && (
                    <Card className="w-full lg:w-[380px] lg:flex-shrink-0 flex flex-col self-start">
                        <CardHeader>
                            <CardTitle>Slide Puzzle</CardTitle>
                            <CardDescription>Upload an image and start solving</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-grow">
                            <div className="space-y-2">
                                <Label className="font-semibold">Image</Label>
                                <Button asChild variant="outline" className="w-full border-dashed border-2">
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <Upload className="mr-2" />
                                        Choose Your Image
                                    </label>
                                </Button>
                                <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <div className="flex items-start space-x-3 pt-2">
                                    <Checkbox id="terms" checked={termsAgreed} onCheckedChange={(checked) => setTermsAgreed(checked as boolean)} className='mt-1' />
                                    <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                                    >
                                    I have rights to use this image and agree to the{' '}
                                    <Link href="/terms-of-service" className="underline hover:text-primary" target="_blank">
                                        Terms of Service
                                    </Link>
                                    .
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">Difficulty</Label>
                                <Select value={String(gridSize)} onValueChange={(value) => setGridSize(Number(value))} disabled={gameState === 'playing' || gameState === 'paused'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select grid size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRID_SIZES.map(size => (
                                            <SelectItem key={size} value={String(size)}>{size} x {size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-guide" className="flex items-center gap-2 font-semibold">
                                    <ImageIcon />
                                    Show Hint
                                </Label>
                                <Switch id="show-guide" checked={showGuide} onCheckedChange={setShowGuide} disabled={!imageSrc} />
                            </div>
                            
                             <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Star className="text-amber-400" /> Best Time</div>
                                <div className="text-xl font-bold">{bestTime}</div>
                            </div>

                            <div className='pt-4'>
                                {gameState === 'ready' || gameState === 'solved' || gameState === 'initial' ? (
                                    <Button onClick={startGame} disabled={!imageSrc || gameState === 'playing' || !termsAgreed} size="lg" className="w-full">
                                        <Play className="mr-2" />
                                        Start Game
                                    </Button>
                                ) : (
                                    <div className='w-full grid grid-cols-2 gap-2'>
                                        <Button onClick={handlePause} variant="outline" size="lg" aria-label={gameState === 'paused' ? "Resume game" : "Pause game"}>
                                            {gameState === 'paused' ? <Play /> : <Pause />}
                                            <span className="ml-2">{gameState === 'paused' ? "Resume" : "Pause"}</span>
                                        </Button>
                                        <Button onClick={stopGame} variant="destructive" size="lg" aria-label="Stop game">
                                            <XCircle />
                                            <span className="ml-2">Stop</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                        </CardContent>
                    </Card>
                )}

                <div className="w-full flex-grow flex flex-col items-center justify-center">
                    <div
                        className="relative bg-muted/20 rounded-lg shadow-inner flex items-center justify-center w-full h-full min-h-[300px] md:min-h-[400px]"
                        ref={puzzleContainerRef}
                    >
                        {!imageSrc ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                <Upload className="w-16 h-16 mb-4" />
                                <p className="text-xl font-medium">{imageSrcFromHome ? "Loading Puzzle..." : "Upload an image to start"}</p>
                            </div>
                        ) : (
                            <>
                                {showControls && 
                                    <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-background p-2 rounded-md shadow-md">
                                             <div className="flex items-center gap-2">
                                                <Puzzle className="w-4 h-4 text-muted-foreground" />
                                                <span>{moves}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TimerIcon className="w-4 h-4 text-muted-foreground" />
                                                <span>{time}</span>
                                            </div>
                                        </div>
                                         <Button
                                            variant="outline"
                                            size="icon"
                                            className="bg-background shadow-md"
                                            onClick={() => setIsPreviewVisible(v => !v)}
                                            >
                                            {isPreviewVisible ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </div>
                                }
                                <div 
                                    className="relative"
                                    style={{ width: puzzleDimension.width, height: puzzleDimension.height }}
                                >
                                    {showGuide && (
                                        <img src={imageSrc} alt="Guide" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                                    )}
                                    {puzzlePieces}
                                     {gameState === 'paused' && (
                                        <div className="absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 rounded-md">
                                            <h2 className="text-5xl font-bold text-white animate-pulse">PAUSED</h2>
                                        </div>
                                    )}
                                </div>
                                {imageSrc && isPreviewVisible && (
                                    <div
                                        ref={previewRef}
                                        onMouseDown={handlePreviewMouseDown}
                                        onTouchStart={handlePreviewMouseDown}
                                        className="absolute z-50 p-1 bg-background/80 backdrop-blur-sm rounded-md shadow-lg flex flex-col border touch-none"
                                        style={{
                                            left: `${previewPos.x}px`,
                                            top: `${previewPos.y}px`,
                                            width: `${previewSize.width}px`,
                                            cursor: isDraggingPreview ? 'grabbing' : 'grab',
                                            willChange: 'width, top, left',
                                        }}
                                    >
                                        <div className="relative">
                                            <Move className="absolute top-1 right-1 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <img src={imageSrc} alt="Original" className="w-full h-auto rounded-md object-contain" />
                                        </div>
                                        <div 
                                            onMouseDown={handlePreviewResizeMouseDown}
                                            onTouchStart={handlePreviewResizeMouseDown}
                                            className="absolute -bottom-1 -right-1 cursor-se-resize p-2"
                                        >
                                            <CornerDownRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={gameState === 'solved'} onOpenChange={(open) => !open && handleDialogClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-3xl text-center flex items-center justify-center gap-2">
                            <Sparkles className="w-8 h-8 text-amber-400" />
                             Congratulations!
                        </DialogTitle>
                        <DialogDescription className="text-center text-lg pt-4 space-y-2">
                            <span className="block">You solved the puzzle in {moves} moves and {time}!</span>
                            <span className="block font-semibold text-foreground">{motivationalMessage}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {imageSrc && (
                        <div className="my-4 flex justify-center">
                            <img src={imageSrc} alt="Solved puzzle" className="w-1/2 rounded-md object-cover shadow-lg" />
                        </div>
                    )}
                    <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
                        <Button onClick={handleDialogClose} className="w-full sm:w-auto">Play Again</Button>
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                           <Link href="/puzzles">More Puzzles</Link>
                        </Button>
                        {slug && imageFilename &&
                          <ShareButton 
                            slug={slug}
                            time={time}
                            imageSrc={imageSrc}
                            imageFilename={imageFilename}
                          />
                        }
                        <DialogClose asChild>
                           <Button type="button" variant="secondary" className="w-full sm:w-auto">
                             Close
                           </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});
PiczzleGame.displayName = "PiczzleGame";
export default PiczzleGame;

    
    