
// src/app/account/subscription-details.tsx
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { getSubscriptionDetails, cancelSubscription, type SubscriptionDetails as SubscriptionDetailsType } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
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

function getPlanName(planId: string | null) {
    switch (planId) {
        case 'monthly_pro':
            return 'Monthly Pro';
        case 'yearly_pro':
            return 'Yearly Pro';
        default:
            return 'Unknown Plan';
    }
}

function SubscriptionDetails({ details, onSubscriptionChange }: { details: SubscriptionDetailsType, onSubscriptionChange: () => void }) {
    const { toast } = useToast();
    const [isCancelling, startCancelTransition] = useTransition();
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    
    const handleCancel = () => {
        if (!details.userId) return;
        startCancelTransition(async () => {
            const result = await cancelSubscription(details.userId!);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                onSubscriptionChange();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            setIsCancelDialogOpen(false);
        });
    }

    if (details.status === 'none') {
        return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground mb-4">You do not have an active Pro subscription.</p>
                <Button asChild>
                    <Link href="/membership">View Membership Plans</Link>
                </Button>
            </div>
        );
    }
    
    const isExpired = details.status === 'expired';
    const isCancelled = details.status === 'cancelled';
    const isActive = details.status === 'active';
    
    return (
        <>
            <Card className="max-w-2xl">
                <CardContent className="p-6 grid gap-4">
                    {isCancelled && (
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Subscription Cancelled</AlertTitle>
                            <AlertDescription>
                                Your subscription will remain active and you will have Pro access until {details.expiresAt ? format(new Date(details.expiresAt), 'PPP') : 'the end of your billing period'}.
                            </AlertDescription>
                        </Alert>
                    )}
                     {isExpired && (
                         <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Subscription Expired</AlertTitle>
                            <AlertDescription>
                                Your subscription has expired. Renew now to regain access to Pro features.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold">{getPlanName(details.planId)}</h3>
                            <Badge variant={isExpired ? "destructive" : isCancelled ? "secondary" : "default"} className="mt-1">
                                {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
                            </Badge>
                        </div>
                        {isActive ? (
                             <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)}>
                                Cancel Subscription
                            </Button>
                        ) : isExpired ? (
                            <Button asChild variant="default">
                                <Link href="/membership">Renew Membership</Link>
                            </Button>
                        ) : null}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-muted p-3 rounded-md">
                            <p className="text-muted-foreground">Start Date</p>
                            <p className="font-semibold">{details.startedAt ? format(new Date(details.startedAt), 'PPP') : 'N/A'}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                            <p className="text-muted-foreground">
                                {isCancelled ? 'Access Ends' : 'Next Renewal'}
                            </p>
                            <p className="font-semibold">{details.expiresAt ? format(new Date(details.expiresAt), 'PPP') : 'N/A'}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                            <p className="text-muted-foreground">Time Remaining</p>
                            <p className="font-semibold">
                                {isExpired || !details.daysRemaining ? 'Expired' : `${details.daysRemaining} days`}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will cancel your subscription. You will still have Pro access until the end of your current billing period. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function SubscriptionManager({ userId }: { userId: string }) {
    const [details, setDetails] = useState<SubscriptionDetailsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [key, setKey] = useState(0);

    const fetchDetails = useCallback(() => {
        setIsLoading(true);
        getSubscriptionDetails(userId)
            .then(data => setDetails({...data, userId}))
            .finally(() => setIsLoading(false));
    }, [userId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails, key]);

    const handleSubscriptionChange = () => {
        setKey(prev => prev + 1);
    }

    if (isLoading) {
        return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading subscription details...</div>;
    }
    
    if (!details) {
         return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground mb-4">Could not load subscription details.</p>
            </div>
        );
    }
    
    return <SubscriptionDetails details={details} onSubscriptionChange={handleSubscriptionChange} />;
}
