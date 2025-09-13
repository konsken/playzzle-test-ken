
'use client';

import { useState, useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
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

import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Star, Shield, ToggleRight, ToggleLeft, CalendarClock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { deletePuzzle, renamePuzzle } from '@/app/puzzles/actions';
import type { PuzzleImage } from './puzzle-card';

type PuzzleAdminActionsProps = {
    image: PuzzleImage;
    onPuzzleUpdate: (newImage: PuzzleImage) => void;
};

export function PuzzleAdminActions({ image, onPuzzleUpdate }: PuzzleAdminActionsProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleRename = (status: "pro" | "standard" | "upcoming" | "disabled" | "enabled") => {
        startTransition(async () => {
            const result = await renamePuzzle(image.category, image.filename, status);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                onPuzzleUpdate({
                    ...image,
                    filename: result.newFilename,
                    src: `/puzzles/${image.category}/${result.newFilename}`,
                    isPro: result.newFilename.startsWith('_pro_'),
                    isDisabled: result.newFilename.startsWith('_disabled_'),
                    isUpcoming: result.newFilename.startsWith('_upcoming_'),
                });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deletePuzzle(image.category, image.filename);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                 // Let the parent component handle removing the card from the UI
                 // This is tricky as we can't easily remove it from here.
                 // A page refresh might be the simplest solution for the user.
                 window.location.reload();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            setIsDeleteOpen(false);
        });
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-full">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Puzzle Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {image.isPro ? (
                            <DropdownMenuItem onClick={() => handleRename('standard')} disabled={isPending}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Make Standard</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleRename('pro')} disabled={isPending}>
                                <Star className="mr-2 h-4 w-4" />
                                <span>Make Pro</span>
                            </DropdownMenuItem>
                        )}
                        {image.isUpcoming ? (
                             <DropdownMenuItem onClick={() => handleRename('standard')} disabled={isPending}>
                               <Shield className="mr-2 h-4 w-4" />
                               <span>Make Standard</span>
                           </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onClick={() => handleRename('upcoming')} disabled={isPending}>
                               <CalendarClock className="mr-2 h-4 w-4" />
                               <span>Mark as Upcoming</span>
                           </DropdownMenuItem>
                        )}
                         {image.isDisabled ? (
                             <DropdownMenuItem onClick={() => handleRename('enabled')} disabled={isPending}>
                               <ToggleRight className="mr-2 h-4 w-4" />
                               <span>Enable Puzzle</span>
                           </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onClick={() => handleRename('disabled')} disabled={isPending}>
                               <ToggleLeft className="mr-2 h-4 w-4" />
                               <span>Disable Puzzle</span>
                           </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setIsDeleteOpen(true)}
                        disabled={isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Puzzle</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
             <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the puzzle file "{image.filename}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
