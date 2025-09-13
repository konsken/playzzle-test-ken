
'use client';

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Upload, Puzzle, RotateCcw, TimerIcon, Sparkles, Play, Pause, XCircle, Eye, EyeOff, Move, CornerDownRight, Star } from 'lucide-react';
import { useTimer } from '@/hooks/use-timer';
import { useBestTime } from '@/hooks/use-best-time';
import ShareButton from './share-button';
import { recordGameCompletion } from '@/app/dashboard/actions';
import type { GameActionsHandle } from './dynamic-puzzle-game';

const motivationalMessages = [
    "You're a puzzle-solving superhero!",
    "Incredible! Your brain is a superpower!",
    "You've conquered the challenge like a true champion!",
    "Brilliant! You've got the mind of a genius!",
];

const DIFFICULTY_LEVELS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type Piece = {
    id: number;
    row: number;
    col: number;
    position: { x: number; y: number };
    isPlaced: boolean;
};

type GameState = 'initial' | 'ready' | 'playing' | 'paused' | 'solved';

type JigsawGameProps = {
    imageSrcFromHome?: string;
    isPreviewVisibleFromHome?: boolean;
    onStatsChange?: (stats: { moves: number; time: string }) => void;
    slug?: string;
    imageFilename?: string;
    gridSizeFromHome?: number;
    onGameStateChange?: (state: GameState) => void;
};

const JigsawGame = forwardRef<GameActionsHandle, JigsawGameProps>(({ 
    imageSrcFromHome, 
    isPreviewVisibleFromHome, 
    onStatsChange, 
    slug, 
    imageFilename,
    gridSizeFromHome,
    onGameStateChange,
 }, ref) => {
    const [gridSize, setGridSize] = useState(gridSizeFromHome || 4);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [pieces, setPieces] = useState<Piece[]>([]);
    const [moves, setMoves] = useState(0);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [puzzleDimension, setPuzzleDimension] = useState({ width: 500, height: 500 });
    const [boardPositions, setBoardPositions] = useState<{ x: number; y: number }[]>([]);
    const { time, seconds: timeInSeconds, isActive, startTimer, pauseTimer, stopTimer, resetTimer } = useTimer();
    const { bestTime, updateBestTime } = useBestTime('jigsaw', gridSize);
    const [motivationalMessage, setMotivationalMessage] = useState("");
    const [gameState, setGameState] = useState<GameState>('initial');
    const [termsAgreed, setTermsAgreed] = useState(false);
    const hasRecordedCompletion = useRef(false);

    const puzzleContainerRef = useRef<HTMLDivElement>(null);
    const draggingPieceRef = useRef<{ pieceId: number; element: HTMLDivElement; offsetX: number; offsetY: number; } | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(true);

    const [previewPos, setPreviewPos] = useState({ x: 20, y: 80 });
    const [isDraggingPreview, setIsDraggingPreview] = useState(false);
    const [isResizingPreview, setIsResizingPreview] = useState(false);
    const [previewSize, setPreviewSize] = useState({ width: 192 });
    const previewRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, startWidth: 0 });

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
    
    const createPuzzle = useCallback((shuffle = false) => {
        if (!imageSrc || !imageSize.width || !puzzleContainerRef.current) return;
    
        const puzzleBoard = puzzleContainerRef.current;
        const totalWidth = puzzleBoard.clientWidth;
        const totalHeight = puzzleBoard.clientHeight;
    
        const imageAspectRatio = imageSize.width / imageSize.height;
        let puzzleWidth = totalWidth * 0.6; // Puzzle board takes 60% of the space
        let puzzleHeight = puzzleWidth / imageAspectRatio;
    
        if (puzzleHeight > totalHeight * 0.9) {
            puzzleHeight = totalHeight * 0.9;
            puzzleWidth = puzzleHeight * imageAspectRatio;
        }
    
        setPuzzleDimension({ width: puzzleWidth, height: puzzleHeight });
    
        const pieceWidth = puzzleWidth / gridSize;
        const pieceHeight = puzzleHeight / gridSize;
    
        const newPieces: Piece[] = [];
        const newBoardPositions: { x: number; y: number }[] = [];
        
        const boardStartX = (totalWidth - puzzleWidth) / 2;
        const boardStartY = (totalHeight - puzzleHeight) / 2;
        const boardEndX = boardStartX + puzzleWidth;
        const boardEndY = boardStartY + puzzleHeight;

        for (let i = 0; i < gridSize * gridSize; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
    
            const boardX = col * pieceWidth;
            const boardY = row * pieceHeight;
            newBoardPositions.push({ x: boardX, y: boardY });
    
            let initialPosition;
            if (shuffle) {
                let x, y;
                let isOverlapping = false;
                do {
                    x = Math.random() * (totalWidth - pieceWidth);
                    y = Math.random() * (totalHeight - pieceHeight);
                    
                    const pieceRight = x + pieceWidth;
                    const pieceBottom = y + pieceHeight;

                    isOverlapping = x < boardEndX && pieceRight > boardStartX && y < boardEndY && pieceBottom > boardStartY;
                    
                    if(isOverlapping) {
                        if (Math.random() < 0.5) { // Move to left
                            x = Math.random() * (boardStartX - pieceWidth);
                        } else { // Move to right
                            x = boardEndX + Math.random() * (totalWidth - boardEndX - pieceWidth);
                        }
                    }

                } while (isOverlapping && (boardStartX > pieceWidth) && (totalWidth - boardEndX > pieceWidth)); // a bit of a safeguard

                initialPosition = { x, y };

            } else {
                initialPosition = { x: boardX + boardStartX, y: boardY + boardStartY };
            }
    
            newPieces.push({
                id: i,
                row,
                col,
                isPlaced: !shuffle,
                position: initialPosition,
            });
        }
        
        if(shuffle) {
            // Re-sort to randomize visual stacking order
            newPieces.sort(() => Math.random() - 0.5);
        }

        setBoardPositions(newBoardPositions);
        setPieces(newPieces);
        setMoves(0);
        resetTimer();
        if (shuffle) {
            setGameState('playing');
            startTimer();
        } else {
            setGameState('ready');
        }
        hasRecordedCompletion.current = false;
    }, [imageSrc, gridSize, imageSize, resetTimer, startTimer]);

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
    
    const startGame = useCallback(() => {
        createPuzzle(true);
    }, [createPuzzle]);

    const stopGame = useCallback(() => {
        stopTimer();
        setGameState('ready');
        createPuzzle(false);
    }, [stopTimer, createPuzzle]);
    
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
        restart: () => createPuzzle(true),
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
            createPuzzle(false);
        }
    }, [imageSrc, imageSize.width, gridSize, createPuzzle]);


    useEffect(() => {
        const handleResize = () => {
            if (imageSrc && imageSize.width > 0 && puzzleContainerRef.current) {
                createPuzzle(gameState !== 'ready' && gameState !== 'initial');
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [imageSrc, imageSize.width, gameState, createPuzzle]);


    const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, pieceId: number) => {
        if (gameState !== 'playing') return;
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || piece.isPlaced) return;

        e.preventDefault();
        const pieceElement = e.currentTarget;
        const rect = pieceElement.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        draggingPieceRef.current = {
            pieceId,
            element: pieceElement,
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top,
        };
        pieceElement.style.zIndex = '1000';
        pieceElement.style.cursor = 'grabbing';
        pieceElement.style.transition = 'none';
    };


    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (gameState !== 'playing' || !draggingPieceRef.current || !puzzleContainerRef.current) return;
    
        e.preventDefault();
        const { element, offsetX, offsetY } = draggingPieceRef.current;
        const containerRect = puzzleContainerRef.current.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
        const newX = clientX - containerRect.left - offsetX;
        const newY = clientY - containerRect.top - offsetY;

        element.style.transform = `translate(${newX}px, ${newY}px)`;
    }, [gameState]);

    const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
        if (gameState !== 'playing' || !draggingPieceRef.current || !puzzleContainerRef.current) return;
        
        e.preventDefault();
        const { pieceId, element } = draggingPieceRef.current;
        
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece) return;

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

        const containerRect = puzzleContainerRef.current.getBoundingClientRect();
        const finalX = clientX - containerRect.left - draggingPieceRef.current.offsetX;
        const finalY = clientY - containerRect.top - draggingPieceRef.current.offsetY;


        const pieceWidth = puzzleDimension.width / gridSize;
        
        const boardStartX = (puzzleContainerRef.current.clientWidth - puzzleDimension.width) / 2;
        const boardStartY = (puzzleContainerRef.current.clientHeight - puzzleDimension.height) / 2;

        const correctPos = boardPositions[pieceId];
        const snapDistance = pieceWidth * 0.3; 

        const dropX = finalX - boardStartX;
        const dropY = finalY - boardStartY;
        
        let isPlaced = false;
        let newPosition = { x: finalX, y: finalY };

        if (Math.abs(dropX - correctPos.x) < snapDistance && Math.abs(dropY - correctPos.y) < snapDistance) {
            newPosition = { x: correctPos.x + boardStartX, y: correctPos.y + boardStartY };
            isPlaced = true;
        }
        
        setPieces(prev => prev.map(p => p.id === pieceId ? {
            ...p,
            position: newPosition,
            isPlaced: isPlaced,
        } : p));
        
        setMoves(m => m + 1);

        element.style.zIndex = isPlaced ? '1' : '10';
        element.style.cursor = isPlaced ? 'default' : 'grab';
        element.style.transition = 'transform 0.2s, z-index 0.2s';


        draggingPieceRef.current = null; 
    }, [pieces, boardPositions, gridSize, puzzleDimension, gameState]);


    useEffect(() => {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd, { passive: false });

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);


    useEffect(() => {
        if (gameState === 'playing' && pieces.length > 0 && pieces.every(p => p.isPlaced) && !hasRecordedCompletion.current) {
            hasRecordedCompletion.current = true; // Set flag immediately
            setGameState('solved');
            stopTimer();
            updateBestTime(timeInSeconds);
            setMotivationalMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
            if (slug && imageFilename) {
                recordGameCompletion({
                    puzzleSlug: slug,
                    category: slug.split('/')[0],
                    gameType: 'jigsaw',
                    difficulty: gridSize,
                    timeInSeconds: timeInSeconds,
                    moves: moves,
                });
            }
        }
    }, [pieces, gameState, stopTimer, updateBestTime, timeInSeconds, slug, imageFilename, gridSize, moves]);
    
   
    
    const handleDialogClose = () => {
        setGameState('ready');
        createPuzzle(false);
    }

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
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full flex-grow flex flex-col lg:flex-row gap-8">
                {showControls && (
                    <Card className="w-full lg:w-[380px] lg:flex-shrink-0">
                        <CardHeader>
                            <CardTitle>Jigsaw Puzzle</CardTitle>
                            <CardDescription>Upload an image and start solving</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="image-upload" className="font-semibold">Image</Label>
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
                                <Label htmlFor="grid-size" className="font-semibold">Difficulty</Label>
                                <Select value={String(gridSize)} onValueChange={(value) => setGridSize(Number(value))} disabled={gameState === 'playing' || gameState === 'paused'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIFFICULTY_LEVELS.map(size => (
                                            <SelectItem key={size} value={String(size)}>{size} x {size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        className="w-full flex-grow bg-muted/20 rounded-lg shadow-inner relative overflow-hidden touch-none"
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
                                {/* Board outlines */}
                                <div 
                                    className="absolute"
                                    style={{
                                        top: `calc(50% - ${puzzleDimension.height/2}px)`,
                                        left: `calc(50% - ${puzzleDimension.width/2}px)`,
                                    }}
                                >
                                    <div
                                        className="relative grid gap-0"
                                        style={{
                                            width: puzzleDimension.width,
                                            height: puzzleDimension.height,
                                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                        }}
                                    >
                                        {Array.from({length: gridSize*gridSize}).map((_, i) => (
                                            <div key={i} className="w-full h-full border border-dashed border-primary/20"/>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Pieces */}
                                {pieces.map(piece => (
                                    <div
                                        key={piece.id}
                                        data-piece-id={piece.id}
                                        onMouseDown={(e) => handleDragStart(e, piece.id)}
                                        onTouchStart={(e) => handleDragStart(e, piece.id)}
                                        className="absolute bg-no-repeat rounded-md shadow-lg"
                                        style={{
                                            width: puzzleDimension.width / gridSize,
                                            height: puzzleDimension.height / gridSize,
                                            backgroundImage: `url(${imageSrc})`,
                                            backgroundSize: `${puzzleDimension.width}px ${puzzleDimension.height}px`,
                                            backgroundPosition: `-${piece.col * (puzzleDimension.width / gridSize)}px -${piece.row * (puzzleDimension.height / gridSize)}px`,
                                            transform: `translate(${piece.position.x}px, ${piece.position.y}px)`,
                                            cursor: piece.isPlaced || gameState !== 'playing' ? 'default' : 'grab',
                                            zIndex: piece.isPlaced ? 1 : 10,
                                            transition: draggingPieceRef.current?.pieceId === piece.id ? 'none' : 'transform 0.2s, z-index 0.2s',
                                            willChange: 'transform',
                                        }}
                                    />
                                ))}
                                {gameState === 'paused' && (
                                    <div className="absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 rounded-md">
                                        <h2 className="text-5xl font-bold text-white animate-pulse">PAUSED</h2>
                                    </div>
                                )}
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
                           <span className="block">You solved the puzzle in {time}!</span>
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
JigsawGame.displayName = "JigsawGame";
export default JigsawGame;

    