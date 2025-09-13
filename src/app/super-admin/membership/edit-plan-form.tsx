
'use client';

import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MembershipPlan } from "./actions";
import { updatePlan, deletePlan } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
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

export function EditPlanForm({ plan }: { plan: MembershipPlan }) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const isCorePlan = ['single_puzzle', 'monthly_pro', 'yearly_pro'].includes(plan.planId);
  
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await updatePlan(plan.id, {message: null, status: null}, formData);
        toast({
            title: result.status === 'success' ? 'Success!' : 'Error',
            description: result.message,
            variant: result.status === 'error' ? 'destructive' : 'default',
        });
    });
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
        const result = await deletePlan(plan.id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsDeleteDialogOpen(false);
    });
  }

  return (
     <>
        <Card>
            <form onSubmit={handleUpdate}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <span>{plan.title}</span>
                            {plan.offerPrice && <Badge variant="destructive" className="whitespace-nowrap">SPECIAL OFFER</Badge>}
                        </CardTitle>
                        {!isCorePlan && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Delete Plan</span>
                            </Button>
                        )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor={`price-${plan.id}`}>Price (in INR)</Label>
                        <Input
                            id={`price-${plan.id}`}
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={plan.price / 100}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`offerPrice-${plan.id}`}>Offer Price (in INR, optional)</Label>
                        <Input
                            id={`offerPrice-${plan.id}`}
                            name="offerPrice"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 80"
                            defaultValue={plan.offerPrice ? plan.offerPrice / 100 : ''}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{plan.title}" plan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeletePending}>
                        {isDeletePending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
     </>
  );
}
