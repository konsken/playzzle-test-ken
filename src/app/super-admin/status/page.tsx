
'use client';

import * as React from "react";
import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, RefreshCw, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { checkFirestoreStatus, checkRazorpayStatus } from "./actions";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ServiceStatusType = 'connected' | 'error' | 'warning' | 'idle';

type ServiceStatus = {
    status: ServiceStatusType;
    message: string;
};

type StatusCardProps = {
    title: string;
    status: ServiceStatusType;
    message: string;
}

function StatusCard({ title, status, message }: StatusCardProps) {
    const config = {
        idle: {
            icon: <Server className="w-8 h-8 text-muted-foreground mt-1 flex-shrink-0" />,
            bg: "bg-muted/50 dark:bg-muted/20 border-border",
            text: "text-foreground",
            messageText: "text-muted-foreground"
        },
        connected: {
            icon: <CheckCircle className="w-8 h-8 text-green-500 mt-1 flex-shrink-0" />,
            bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
            text: "text-green-800 dark:text-green-300",
            messageText: "text-green-700 dark:text-green-400"
        },
        warning: {
            icon: <AlertTriangle className="w-8 h-8 text-yellow-500 mt-1 flex-shrink-0" />,
            bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
            text: "text-yellow-800 dark:text-yellow-300",
            messageText: "text-yellow-700 dark:text-yellow-400"
        },
        error: {
            icon: <XCircle className="w-8 h-8 text-red-500 mt-1 flex-shrink-0" />,
            bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
            text: "text-red-800 dark:text-red-300",
            messageText: "text-red-700 dark:text-red-400"
        }
    };
    
    const currentConfig = config[status];

    return (
        <div className={cn(
            "p-6 rounded-lg border flex items-start gap-4",
            currentConfig.bg
        )}>
            {currentConfig.icon}
            <div>
                <h3 className={cn("text-lg font-semibold", currentConfig.text)}>{title}</h3>
                <p className={cn("text-sm mt-1", currentConfig.messageText)}>{message}</p>
            </div>
        </div>
    )
}


function StatusSkeleton() {
    return (
        <div className="p-6 rounded-lg border flex items-start gap-4">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-grow space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    )
}

export default function SystemStatusPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [firestoreStatus, setFirestoreStatus] = React.useState<ServiceStatus>({ status: 'idle', message: 'Ready to check connection.' });
    const [razorpayStatus, setRazorpayStatus] = React.useState<ServiceStatus>({ status: 'idle', message: 'Ready to check configuration.' });

    const handleCheckStatus = async () => {
        setIsLoading(true);
        const [fsStatus, rzpStatus] = await Promise.all([
            checkFirestoreStatus(),
            checkRazorpayStatus(),
        ]);
        setFirestoreStatus(fsStatus);
        setRazorpayStatus(rzpStatus);
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-3xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold mb-2">System Status</h1>
                <p className="text-muted-foreground mb-8">
                    Check the health and connectivity of critical services on demand.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Service Connections</CardTitle>
                        <CardDescription>
                            This page verifies that the application can communicate with external services. If you see an error, it likely points to a configuration issue, such as missing environment variables on the server.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <>
                                <StatusSkeleton />
                                <StatusSkeleton />
                            </>
                        ) : (
                            <>
                                <StatusCard 
                                    title="Firebase Firestore"
                                    status={firestoreStatus.status}
                                    message={firestoreStatus.message}
                                />
                                <StatusCard 
                                    title="Razorpay Payments"
                                    status={razorpayStatus.status}
                                    message={razorpayStatus.message}
                                />
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCheckStatus} disabled={isLoading}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                            {isLoading ? 'Checking...' : 'Check Status'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
