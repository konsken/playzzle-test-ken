
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar, BarChart, AlertTriangle, Crown, Loader2 } from "lucide-react";
import { getRevenueStats, type RevenueStats } from './actions';
import { getUsers, type SimpleUser } from '../users/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResetButton } from "./reset-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function formatPrice(priceInPaise: number) {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
}

type UserData = {
    proUsers: SimpleUser[];
    superAdmins: SimpleUser[];
    freeUsers: number;
    monthlyPro: number;
    yearlyPro: number;
    totalUsers: number;
}

export default function RevenuePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // In a real app, we'd want to get the current user's email securely,
                // but for this client-side page, we'll just check if the button should exist.
                // The actual server action for reset has its own strong security check.
                if(typeof window !== "undefined") {
                    const auth = (await import('firebase/auth')).getAuth();
                    setUserEmail(auth.currentUser?.email || null);
                }

                // Fetch a large number of users to get all for stats
                const { users } = await getUsers(1, 10000); 
                const revStats = await getRevenueStats();

                const proUsers = users.filter(u => u.proTier);
                const superAdmins = users.filter(u => u.isSuperAdmin);
                const freeUsers = users.length - proUsers.length;
                const monthlyPro = proUsers.filter(u => u.proTier === 'monthly_pro').length;
                const yearlyPro = proUsers.filter(u => u.proTier === 'yearly_pro').length;

                setUserData({ proUsers, superAdmins, freeUsers, monthlyPro, yearlyPro, totalUsers: users.length });
                setRevenueStats(revStats);
            } catch (error) {
                console.error("Failed to fetch revenue/user stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (isLoading || !revenueStats || !userData) {
        return (
            <div className="container mx-auto py-8 px-4 flex justify-center items-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8 px-4">
             <div className="flex justify-between items-start mb-4">
                <Button asChild variant="outline">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                {userEmail === 'kapil.webfoxtech@gmail.com' && <ResetButton />}
            </div>

            <h1 className="text-3xl font-bold mb-8">Revenue & User Statistics</h1>
            
            {revenueStats.error && (
                <Alert variant="destructive" className="mb-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Database Index Required</AlertTitle>
                    <AlertDescription>
                        The revenue query needs a database index to work correctly. Please visit the following URL to create it, then refresh this page.
                        <a href={revenueStats.error.message.match(/https?:\/\/[^\s]+/)?.[0]} target="_blank" rel="noopener noreferrer" className="block bg-destructive-foreground/10 p-2 rounded mt-2 text-xs break-all">
                           {revenueStats.error.message.match(/https?:\/\/[^\s]+/)?.[0]}
                        </a>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(revenueStats.total)}</div>
                        <p className="text-xs text-muted-foreground">
                           from {revenueStats.count} transactions
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(revenueStats.last30Days)}</div>
                         <p className="text-xs text-muted-foreground">
                           from {revenueStats.last30DaysCount} transactions
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last 365 Days</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(revenueStats.last365Days)}</div>
                         <p className="text-xs text-muted-foreground">
                           from {revenueStats.last365DaysCount} transactions
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.proUsers.length}</div>
                         <p className="text-xs text-muted-foreground">
                           {userData.monthlyPro} Monthly / {userData.yearlyPro} Yearly
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Free Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.freeUsers}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.superAdmins.length}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>How are these calculated?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Revenue:</strong> Calculated from all successful transactions in the `transactions` collection.</p>
                    <p><strong>Total Users:</strong> The total number of accounts registered via Firebase Authentication.</p>
                    <p><strong>Pro Users:</strong> Users with an active, non-expired subscription in the `users` collection.</p>
                    <p><strong>Free Users:</strong> The count of Total Users minus the count of Pro Users.</p>
                    <p><strong>Super Admins:</strong> Users with the 'superadmin' custom claim set in Firebase Authentication.</p>
                </CardContent>
            </Card>
        </div>
    );
}
