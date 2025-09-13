
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getContactSubmissions, type ContactSubmission, type PaginatedMessages } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { MessageActions } from "./message-actions";
import { format } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";
import { Search } from "@/components/search";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<PaginatedMessages | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const page = Number(searchParams.get('page') ?? 1);
    const searchQuery = searchParams.get('q') ?? '';
    const limit = 10;

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getContactSubmissions(page, limit, searchQuery);
            setData(result);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            setData({ messages: [], totalCount: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchQuery]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const totalPages = data ? Math.ceil(data.totalCount / limit) : 0;
    const messages = data?.messages || [];

    return (
        <div className="container mx-auto py-8 px-4">
            <Button asChild variant="outline" className="mb-4">
                <Link href="/super-admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-8">Contact Form Messages</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Messages submitted through the contact form.</CardDescription>
                    <div className="pt-4">
                        <Search placeholder="Search messages..." />
                    </div>
                </CardHeader>
                <CardContent>
                   {isLoading ? (
                     <div className="flex justify-center items-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin" />
                     </div>
                   ) : messages.length === 0 ? (
                     <p className="text-muted-foreground text-center py-8">
                        {searchQuery ? `No messages found for "${searchQuery}".` : "No messages yet."}
                    </p>
                   ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">From</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="hidden md:table-cell">Message</TableHead>
                                <TableHead className="hidden lg:table-cell w-[180px]">Received</TableHead>
                                <TableHead className="w-[80px]">Status</TableHead>
                                <TableHead className="text-right w-[50px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {messages.map((message) => (
                                <TableRow key={message.id} className={!message.read ? 'font-bold' : ''}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{message.firstName} {message.lastName}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{message.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{message.subject}</TableCell>
                                    <TableCell className="hidden md:table-cell max-w-sm truncate font-normal">
                                        {message.message}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell font-normal">
                                        {format(new Date(message.createdAt), "PPP p")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={message.read ? "secondary" : "default"}>
                                            {message.read ? 'Read' : 'Unread'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <MessageActions message={message} />
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
