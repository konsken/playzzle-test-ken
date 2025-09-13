
'use client';

import { useState, useEffect, useCallback } from 'react';

type GameType = 'slide' | 'jigsaw';

const getBestTimes = (): Record<string, number> => {
  try {
    const times = localStorage.getItem('playzzle-best-times');
    return times ? JSON.parse(times) : {};
  } catch (error) {
    console.error("Could not read best times from localStorage", error);
    return {};
  }
};

export const useBestTime = (gameType: GameType, gridSize: number) => {
  const [bestTime, setBestTime] = useState<string>('--:--');

  const key = `${gameType}-${gridSize}`;

  useEffect(() => {
    const allTimes = getBestTimes();
    const timeInSeconds = allTimes[key];
    if (timeInSeconds) {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      setBestTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setBestTime('--:--');
    }
  }, [key]);

  const updateBestTime = useCallback((newTimeInSeconds: number) => {
    const allTimes = getBestTimes();
    const currentTime = allTimes[key];
    if (!currentTime || newTimeInSeconds < currentTime) {
      try {
        allTimes[key] = newTimeInSeconds;
        localStorage.setItem('playzzle-best-times', JSON.stringify(allTimes));
        const minutes = Math.floor(newTimeInSeconds / 60);
        const seconds = newTimeInSeconds % 60;
        setBestTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } catch (error) {
        console.error("Could not save best time to localStorage", error);
      }
    }
  }, [key]);

  return { bestTime, updateBestTime };
};
