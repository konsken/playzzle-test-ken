
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";
import { getUsers, UserFilter, type PaginatedUsers } from "./actions";
import { PaginationControls } from "@/components/pagination-controls";
import { Search } from "@/components/search";
import { formatDistanceToNow } from 'date-fns';
import { Crown, ArrowLeft, Loader2 } from "lucide-react";
import { FilterControls } from "./filter-controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function UsersPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const page = Number(searchParams.get('page') ?? 1);
    const searchQuery = searchParams.get('q') ?? '';
    const filter = (searchParams.get('filter') as UserFilter) ?? 'all';
    const limit = 10;
    
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getUsers(page, limit, searchQuery, filter);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setData({ users: [], totalCount: 0, counts: { all: 0, superadmin: 0, pro: 0, standard: 0 } });
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchQuery, filter]);
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const totalPages = data ? Math.ceil(data.totalCount / limit) : 0;
    const users = data?.users || [];

    return (
        <div className="container mx-auto py-8 px-4">
            <Button asChild variant="outline" className="mb-4">
                <Link href="/super-admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-8">User Management</h1>
             <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users in your application.</CardDescription>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="flex-grow">
                           <Search placeholder="Search by name or email..." />
                        </div>
                        {data && <FilterControls counts={data.counts} />}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-16">
                           <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {searchQuery ? `No users found for "${searchQuery}".` : "No users found for this filter."}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Membership</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.disabled ? "secondary" : "default"}>
                                                {user.disabled ? 'Disabled' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.isSuperAdmin ? (
                                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                    <Crown className="h-3 w-3" />
                                                    <span>Super Admin</span>
                                                </Badge>
                                            ) : (
                                                'User'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.proTier ? (
                                                <div className="flex flex-col">
                                                   <Badge variant="default" className="capitalize w-fit">
                                                        {user.proTier.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Expires in {formatDistanceToNow(new Date(user.proExpiry!))}
                                                    </span>
                                                </div>
                                            ) : (
                                                'Standard'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <UserActions user={user} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter>
                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                        />
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
