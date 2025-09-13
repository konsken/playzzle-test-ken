
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { ArrowRight, Loader2, Pencil, Trash2 } from 'lucide-react';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import PuzzleCard from './puzzle-card';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AdminControls } from './admin-controls';
import { renameCategory, deleteCategory, checkAndReleaseDailyPuzzle } from '@/app/puzzles/actions';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import type { PuzzleImage, UserDataState } from '@/app/puzzles/page';

type CategoryWithPuzzles = {
    name: string;
    displayOrder: number;
    puzzles: PuzzleImage[];
}

type HomePageProps = {
  categories: CategoryWithPuzzles[];
  isSuperAdmin: boolean;
  user: AuthenticatedUser | null;
  initialUserData: UserDataState;
};

const INITIAL_CATEGORIES = 5;
const LOAD_MORE_COUNT = 2;

function formatCategoryName(name: string) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function CategoryCarousel({ category, puzzles, ...rest }: { category: string, puzzles: PuzzleImage[], [key: string]: any }) {
    if (puzzles.length === 0 && !rest.isSuperAdmin) {
        return null; // Don't render the carousel if there are no puzzles for non-admins
    }

    return (
        <Carousel
            opts={{
                align: 'start',
                loop: puzzles.length > 5,
            }}
            className="w-full"
        >
            <CarouselContent>
                {puzzles.length > 0 ? puzzles.map((image) => (
                    <CarouselItem key={image.filename} className="md:basis-1/3 lg:basis-1/5">
                        <div className="p-1">
                            <PuzzleCard image={image} {...rest} />
                        </div>
                    </CarouselItem>
                )) : (
                     <CarouselItem>
                        <div className="p-1 text-center text-muted-foreground">
                            This category is empty. Upload a puzzle!
                        </div>
                    </CarouselItem>
                )}
            </CarouselContent>
            <CarouselPrevious className="absolute top-1/2 -left-4 -translate-y-1/2" />
            <CarouselNext className="absolute top-1/2 -right-4 -translate-y-1/2" />
        </Carousel>
    );
}

function CategoryAdminActions({ category, onRename, onDelete }: { category: string, onRename: (oldName: string, newName: string) => void, onDelete: (name: string) => void }) {
    const { toast } = useToast();
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState(category);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

    const handleRename = async () => {
        const result = await renameCategory(category, newCategoryName);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            onRename(category, newCategoryName);
            setIsRenameOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

    const handleDelete = async () => {
        const result = await deleteCategory(category);
         if (result.success) {
            toast({ title: 'Success', description: result.message });
            onDelete(category);
            setIsDeleteOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

    const handleOpenDeleteDialog = (open: boolean) => {
        if (!open) {
            setDeleteConfirmationInput('');
        }
        setIsDeleteOpen(open);
    }

    return (
        <>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsRenameOpen(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            
             {/* Rename Dialog */}
            <AlertDialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rename Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter a new name for the category '{formatCategoryName(category)}'. Use lowercase letters, numbers, and hyphens only.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRename}>Rename</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             {/* Delete Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={handleOpenDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete the category '{formatCategoryName(category)}' and all puzzles inside it. This action cannot be undone.
                           <br/><br/>
                           To confirm, please type <strong>delete</strong> in the box below.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label htmlFor="delete-confirm-input" className="sr-only">Confirm Deletion</Label>
                        <Input 
                            id="delete-confirm-input"
                            value={deleteConfirmationInput}
                            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                            placeholder='Type "delete" to confirm'
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteConfirmationInput !== 'delete'}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default function HomePage({ categories: initialCategories, isSuperAdmin, user, initialUserData }: HomePageProps) {
  const [allCategories, setAllCategories] = useState(initialCategories);
  const [visibleCategories, setVisibleCategories] = useState(
    initialCategories.slice(0, INITIAL_CATEGORIES)
  );
  
  useEffect(() => {
    async function dailyCheck() {
        await checkAndReleaseDailyPuzzle();
    }
    dailyCheck();
  }, []); 

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 500) {
      return;
    }
    
    if (visibleCategories.length < allCategories.length) {
      const nextIndex = visibleCategories.length;
      const newCategories = allCategories.slice(nextIndex, nextIndex + LOAD_MORE_COUNT);
      setVisibleCategories(prev => [...new Set([...prev, ...newCategories])]);
    }
  }, [visibleCategories.length, allCategories]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  useEffect(() => {
    setAllCategories(initialCategories);
    setVisibleCategories(initialCategories.slice(0, INITIAL_CATEGORIES));
  }, [initialCategories]);

  const handleRenameCategory = (oldName: string, newName: string) => {
    const update = (list: CategoryWithPuzzles[]) => list.map(c => c.name === oldName ? {...c, name: newName} : c).sort((a,b) => a.displayOrder - b.displayOrder);
    setAllCategories(update);
    setVisibleCategories(update);
  }
  
  const handleDeleteCategory = (name: string) => {
    const update = (list: CategoryWithPuzzles[]) => list.filter(c => c.name !== name);
    setAllCategories(update);
    setVisibleCategories(update);
  }

  if (allCategories.length === 0 && !isSuperAdmin) {
    return (
        <div className="container mx-auto py-8 px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome to Playzzle!</h1>
            <p className="text-muted-foreground">No puzzles found. The administrator needs to add some puzzles to get started.</p>
        </div>
    )
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
    <div className="container mx-auto py-8 px-4">
      {isSuperAdmin && <AdminControls categories={allCategories.map(c => c.name)} />}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {allCategories.map((category) => (
                  <li key={category.name}>
                    <Button variant="ghost" className="w-full justify-start capitalize" asChild>
                      <Link href={`/category/${category.name}`}>{formatCategoryName(category.name)}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-8">
          {visibleCategories.map((category) => (
              <div key={category.name} id={category.name} className="scroll-mt-20 relative">
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-2xl font-bold capitalize">{formatCategoryName(category.name)}</h2>
                  <div className="flex items-center gap-2">
                      {isSuperAdmin && <CategoryAdminActions category={category.name} onRename={handleRenameCategory} onDelete={handleDeleteCategory} />}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/category/${category.name}`}>
                          View More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                  </div>
                </div>
                <CategoryCarousel category={category.name} puzzles={category.puzzles} {...userProps} />
              </div>
            ))
          }
           {allCategories.length === 0 && isSuperAdmin && (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold">No Categories Found</h2>
                <p className="text-muted-foreground mt-2">Use the controls to create your first puzzle category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

    