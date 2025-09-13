
'use client';

import { useState, useEffect, useCallback } from "react";
import { getInterestedUsers, type PaginatedUsers } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";
import { Search } from "@/components/search";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export default function ProUsersPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const page = Number(searchParams.get('page') ?? 1);
    const searchQuery = searchParams.get('q') ?? '';
    const limit = 10;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getInterestedUsers(page, limit, searchQuery);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch interested users:", error);
            setData({ users: [], totalCount: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchQuery]);

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
            <h1 className="text-3xl font-bold mb-8">Pro Membership Interest List</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Interested Users</CardTitle>
                    <CardDescription>Users who signed up to be notified about Playzzle Pro.</CardDescription>
                    <div className="pt-4">
                        <Search placeholder="Search by name or email..." />
                    </div>
                </CardHeader>
                <CardContent>
                   {isLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                   ) : users.length === 0 ? (
                     <p className="text-muted-foreground text-center py-8">
                        {searchQuery ? `No users found for "${searchQuery}".` : "No one has signed up yet."}
                    </p>
                   ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden md:table-cell">Date Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((interestedUser) => (
                                <TableRow key={interestedUser.id}>
                                    <TableCell>{interestedUser.name}</TableCell>
                                    <TableCell>{interestedUser.email}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {format(new Date(interestedUser.createdAt), "PPP p")}
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
