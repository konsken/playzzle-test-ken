
// src/components/puzzle-card.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import { CheckCircle, Heart, Star, EyeOff, CalendarClock } from 'lucide-react';
import { useState, useTransition, useOptimistic } from 'react';
import { toggleWishlist, useSinglePuzzleCredit } from '@/app/account/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PuzzleAdminActions } from './puzzle-admin-actions';
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


export type PuzzleImage = {
  src: string;
  category: string;
  filename: string;
  isPro: boolean;
  isDisabled: boolean;
  isUpcoming: boolean;
};

type PuzzleCardProps = {
  image: PuzzleImage;
  isSuperAdmin: boolean;
  isProUser: boolean;
  unlockedPuzzleIds: string[];
  user: AuthenticatedUser | null;
  singlePurchaseCredits: { count: number; transactionIds: string[] };
  wishlist: string[];
  priority?: boolean;
};

export default function PuzzleCard({
  image: initialImage,
  isSuperAdmin,
  isProUser,
  unlockedPuzzleIds,
  user,
  singlePurchaseCredits,
  wishlist,
  priority = false,
}: PuzzleCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [image, setImage] = useState(initialImage);
  const [dialog, setDialog] = useState<'closed' | 'purchase' | 'use_credit' | 'upcoming'>('closed');

  const [optimisticIsWished, setOptimisticIsWished] = useOptimistic(
    wishlist.includes(image.filename),
    (state) => !state
  );

  const isIndividuallyUnlocked = image.isPro && unlockedPuzzleIds.includes(image.filename);
  
  // A puzzle is playable if it's NOT disabled, NOT upcoming, and the user has access.
  const isPlayable = 
      !image.isDisabled && 
      !image.isUpcoming &&
      (isSuperAdmin || isIndividuallyUnlocked || isProUser || !image.isPro);
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
          router.push('/login');
          return;
      }
      
      startTransition(async () => {
          setOptimisticIsWished(!optimisticIsWished);
          const result = await toggleWishlist(image.filename);
          if (result.success) {
              toast({ title: result.message });
          } else {
              toast({ variant: "destructive", title: "Error", description: result.message });
          }
      });
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (image.isUpcoming) {
      setDialog('upcoming');
      return;
    }

    if (isPlayable) {
      router.push(`/play/${image.category}/${encodeURIComponent(image.filename)}`);
      return;
    }
    
    // Logic for non-playable puzzles (Pro puzzles for non-pro users)
    if (!user) {
      router.push('/login');
      return;
    }

    if (singlePurchaseCredits.count > 0 && singlePurchaseCredits.transactionIds.length > 0) {
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
        const creditToUse = singlePurchaseCredits.transactionIds[0];
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

  const PuzzleImageComponent = (
     <div className={cn(
        "aspect-[3/4] relative",
        (image.isDisabled || image.isUpcoming) && !isSuperAdmin ? "grayscale opacity-50" : ""
      )}>
        <Image
          src={image.src}
          alt={`Puzzle ${image.filename}`}
          fill
          priority={priority}
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          data-ai-hint="puzzle nature"
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`puzzle-pattern-${image.filename.replace(/[^a-zA-Z0-9-]/g, '')}`} patternUnits="userSpaceOnUse" width="100" height="100">
                <path d="M50 0 v20 a15 15 0 0 0 0 30 v20 a15 15 0 0 1 0 30 v20 M0 50 h20 a15 15 0 0 1 30 0 h20 a15 15 0 0 0 30 0 h20"
                  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#puzzle-pattern-${image.filename.replace(/[^a-zA-Z0-9-]/g, '')})`} />
          </svg>
        </div>
      </div>
  );

  return (
    <>
    <Card className="overflow-hidden relative group cursor-pointer">
        
      {/* Status Badges */}
      <div className="absolute top-2 right-2 z-10">
        {image.isUpcoming ? (
            <Badge variant="outline" className="bg-blue-500 text-white border-blue-500">
                <CalendarClock className="w-3 h-3 mr-1" />
                UPCOMING
            </Badge>
        ) : image.isDisabled ? (
            <Badge variant="secondary">
                <EyeOff className="w-3 h-3 mr-1" />
                DISABLED
            </Badge>
        ) : image.isPro ? (
            isIndividuallyUnlocked ? (
                 <Badge variant="secondary" className="bg-green-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Unlocked
                </Badge>
            ) : (
                <Badge variant="destructive">
                    <Star className="w-3 h-3 mr-1" />
                    PRO
                </Badge>
            )
        ) : null}
      </div>
      
      {/* Wishlist Button */}
      {user && !image.isDisabled && !image.isUpcoming && (
          <button
              onClick={handleWishlistToggle}
              disabled={isPending}
              className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white transition-colors hover:bg-black/75 hover:text-red-500"
              aria-label="Add to wishlist"
          >
              <Heart className={cn("w-5 h-5", optimisticIsWished && "fill-red-500 text-red-500")} />
          </button>
      )}

      <CardContent className="p-0" onClick={handleCardClick}>
         <a>
            {PuzzleImageComponent}
         </a>
      </CardContent>

       {isSuperAdmin && (
            <div className="absolute bottom-2 right-2 z-20">
                <PuzzleAdminActions image={image} onPuzzleUpdate={setImage} />
            </div>
      )}
    </Card>

    {/* Upcoming Puzzle Dialog */}
    <AlertDialog open={dialog === 'upcoming'} onOpenChange={() => setDialog('closed')}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CalendarClock className="text-blue-500" />
            Coming Soon!
          </AlertDialogTitle>
          <AlertDialogDescription>
            This puzzle is not available yet. Please check back later!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setDialog('closed')}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Pro Puzzle - Need to Buy Dialog */}
    <AlertDialog open={dialog === 'purchase'} onOpenChange={() => setDialog('closed')}>
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

    {/* Pro Puzzle - Use Credit Dialog */}
    <AlertDialog open={dialog === 'use_credit'} onOpenChange={() => setDialog('closed')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="text-green-500" />
                Use Your Puzzle Credit
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have {singlePurchaseCredits.count} puzzle credit(s) available. Would you like to use one to unlock this puzzle permanently?
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
