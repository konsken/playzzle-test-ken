"use client";

import { useState, useRef, useCallback } from 'react';

const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const useTimer = () => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback(() => {
        if (timerRef.current) return;
        setIsActive(true);
        timerRef.current = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }, []);

    const pauseTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            setIsActive(false);
        }
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsActive(false);
    }, []);

    const resetTimer = useCallback(() => {
        stopTimer();
        setSeconds(0);
    }, [stopTimer]);

    return {
        time: formatTime(seconds),
        seconds,
        isActive,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer,
    };
};
