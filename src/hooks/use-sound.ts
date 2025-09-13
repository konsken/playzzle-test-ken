'use client';

import { useState, useCallback, useEffect } from 'react';

export const useSound = (src: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Audio is a browser-only feature.
    const newAudio = new Audio(src);
    setAudio(newAudio);
  }, [src]);

  const play = useCallback(() => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Failed to play sound:", e));
    }
  }, [audio]);

  return play;
};
