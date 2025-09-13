
'use client';

import React, { useState, useEffect, useRef } from 'react';
import PuzzleCard from '@/components/puzzle-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getSinglePuzzleCredits, getUserProStatus, getUnlockedPuzzles, getWishlist } from '@/app/account/actions';


type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};

type UserData = {
  isPro: boolean;
  isSuperAdmin: boolean;
  unlockedPuzzleIds: string[];
  singlePurchaseCredits: { count: number; transactionIds: string[] };
  wishlist: string[];
} | null;


function PuzzleGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="h-[250px] w-full" />
                </div>
            ))}
        </div>
    );
}


export function PuzzlesGrid({ initialPuzzles }: { initialPuzzles: PuzzleImage[] }) {
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [userData, setUserData] = useState<UserData>(null);
    const dataFetchedRef = useRef(false);

    const auth = getAuth();
    const [user, loading] = useAuthState(auth);
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                setUserData({
                    isPro: false,
                    isSuperAdmin: false,
                    unlockedPuzzleIds: [],
                    singlePurchaseCredits: { count: 0, transactionIds: [] },
                    wishlist: [],
                });
                setIsLoadingUser(false);
                return;
            }

            try {
                const idTokenResult = await user.getIdTokenResult();
                const isSuperAdmin = !!idTokenResult.claims.superadmin;
                
                const [
                    proStatus,
                    unlocked,
                    credits,
                    wish
                ] = await Promise.all([
                    getUserProStatus(user.uid),
                    getUnlockedPuzzles(user.uid),
                    getSinglePuzzleCredits(user.uid),
                    getWishlist(user.uid),
                ]);

                setUserData({
                    isPro: proStatus.isPro,
                    isSuperAdmin,
                    unlockedPuzzleIds: unlocked,
                    singlePurchaseCredits: credits,
                    wishlist: wish,
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                 setUserData({
                    isPro: false,
                    isSuperAdmin: false,
                    unlockedPuzzleIds: [],
                    singlePurchaseCredits: { count: 0, transactionIds: [] },
                    wishlist: [],
                });
            } finally {
                setIsLoadingUser(false);
            }
        };

        if (!loading && !dataFetchedRef.current) {
            dataFetchedRef.current = true;
            fetchUserData();
        }
    }, [user, loading]);

    if (isLoadingUser || loading) {
        return <PuzzleGridSkeleton />;
    }
    
    if (initialPuzzles.length === 0) {
        return <p className="text-muted-foreground">No puzzles found in this category.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {initialPuzzles.map((image) => (
                <PuzzleCard
                    key={image.filename}
                    image={image}
                    user={user ? { uid: user.uid, email: user.email, name: user.displayName, picture: user.photoURL } : null}
                    isProUser={userData?.isPro || false}
                    isSuperAdmin={userData?.isSuperAdmin || false}
                    unlockedPuzzleIds={userData?.unlockedPuzzleIds || []}
                    singlePurchaseCredits={userData?.singlePurchaseCredits || { count: 0, transactionIds: [] }}
                    wishlist={userData?.wishlist || []}
                />
            ))}
        </div>
    );
}

    