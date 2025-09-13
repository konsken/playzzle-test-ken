// src/lib/types.ts
import type { Timestamp } from 'firebase-admin/firestore';

export type GameHistoryEvent = {
    uid: string;
    puzzleSlug: string;
    category: string;
    gameType: 'slide' | 'jigsaw';
    difficulty: number; // grid size
    timeInSeconds: number;
    moves: number;
    completedAt: Timestamp;
};
