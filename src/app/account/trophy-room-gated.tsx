
'use client';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

export function TrophyRoomGated() {
    const router = useRouter();

    const handleGoToMembership = () => {
        router.push('/membership');
    };

    return (
        <AlertDialog open={true} onOpenChange={() => {}}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Star className="text-amber-400" />
                        Pro Feature Locked
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        The Trophy Room is an exclusive feature for our Pro members. Upgrade to a <strong>Monthly Pro</strong> or <strong>Yearly Pro</strong> plan to track your solved puzzles and view personal bests.
                        <br/><br/>
                        <span className="text-xs text-muted-foreground italic">Note: This feature is not included with a 'Single Puzzle Credit' purchase.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleGoToMembership}>
                        View Membership Plans
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
