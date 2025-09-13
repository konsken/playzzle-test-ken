
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from './ui/button';
import { Star, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import { useSinglePuzzleCredit } from '@/app/account/actions';
import { useToast } from '@/hooks/use-toast';

type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
};

type ProPuzzleLinkProps = {
  image: PuzzleImage;
  isSuperAdmin: boolean;
  isProUser: boolean;
  unlockedPuzzleIds?: string[];
  children: React.ReactNode;
  user: AuthenticatedUser | null;
  singlePurchaseCredits?: { count: number; transactionIds: string[] };
};

export default function ProPuzzleLink({ image, isSuperAdmin, isProUser, unlockedPuzzleIds = [], user, singlePurchaseCredits, children }: ProPuzzleLinkProps) {
  const [dialog, setDialog] = useState<'closed' | 'purchase' | 'use_credit'>('closed');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isUnlocked = isSuperAdmin || isProUser || (unlockedPuzzleIds && unlockedPuzzleIds.includes(image.filename));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Always prevent default to control flow
    if (isUnlocked) {
      router.push(`/play/${image.category}/${encodeURIComponent(image.filename)}`);
      return;
    }
    
    if (!user) {
        router.push('/login');
        return;
    }

    if (singlePurchaseCredits && singlePurchaseCredits.count > 0 && singlePurchaseCredits.transactionIds.length > 0) {
      setDialog('use_credit');
    } else {
      setDialog('purchase');
    }
  };

  const handleGoToMembership = () => {
    router.push('/membership');
  };

  const handleUseCredit = () => {
    startTransition(async () => {
        const creditToUse = singlePurchaseCredits?.transactionIds[0];
        if (!creditToUse) return;

        const result = await useSinglePuzzleCredit(creditToUse, image.filename, image.category);
        if (result.success) {
            toast({
                title: "Puzzle Unlocked!",
                description: "This puzzle is now permanently available in your account.",
            });
            setDialog('closed');
            router.refresh(); // Refresh to update user's unlocked puzzles
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
    });
  }

  return (
    <>
      <a
        href={`/play/${image.category}/${encodeURIComponent(image.filename)}`}
        onClick={handleClick}
        className="cursor-pointer"
      >
        {children}
      </a>
      
      {/* Dialog for users who need to buy a credit */}
      <AlertDialog open={dialog === 'purchase'} onOpenChange={(open) => !open && setDialog('closed')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <Star className="text-amber-400" />
                Pro Puzzle
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is a premium puzzle. To play, please purchase a 'Single Puzzle Credit' from the membership page. Once purchased, you can come back here to unlock it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToMembership}>
                Go to Memberships
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Dialog for users who have a credit */}
      <AlertDialog open={dialog === 'use_credit'} onOpenChange={(open) => !open && setDialog('closed')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="text-green-500" />
                Use Your Puzzle Credit
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have {singlePurchaseCredits?.count} puzzle credit(s) available. Would you like to use one to unlock this puzzle permanently?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
             <AlertDialogCancel onClick={() => setDialog('closed')} disabled={isPending}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleUseCredit} disabled={isPending}>
                {isPending ? 'Unlocking...' : 'Unlock This Puzzle'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
