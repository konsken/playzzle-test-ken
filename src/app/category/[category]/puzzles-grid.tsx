
'use client';

import React, { useState } from 'react';
import PuzzleCard from '@/components/puzzle-card';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import type { UserDataState } from '@/app/puzzles/page';

type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};

type PuzzlesGridProps = {
  initialPuzzles: PuzzleImage[];
  user: AuthenticatedUser | null;
  isSuperAdmin: boolean;
  initialUserData: UserDataState;
};

export function PuzzlesGrid({ initialPuzzles, user, isSuperAdmin, initialUserData }: PuzzlesGridProps) {
    if (initialPuzzles.length === 0) {
        return <p className="text-muted-foreground">No puzzles found in this category.</p>;
    }

    const userProps = {
        user,
        isSuperAdmin,
        isProUser: initialUserData?.isPro || false,
        unlockedPuzzleIds: initialUserData?.unlockedPuzzleIds || [],
        singlePurchaseCredits: initialUserData?.singlePurchaseCredits || { count: 0, transactionIds: [] },
        wishlist: initialUserData?.wishlist || [],
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {initialPuzzles.map((image) => (
                <PuzzleCard
                    key={image.filename}
                    image={image}
                    {...userProps}
                />
            ))}
        </div>
    );
}
