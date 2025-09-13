

'use client';

import { useState, useTransition } from 'react';
import type { Category } from '@/app/puzzles/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateCategoryOrders } from '@/app/puzzles/actions';
import { Loader2 } from 'lucide-react';

function formatCategoryName(name: string) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function CategoryOrderManager({ categories }: { categories: Category[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [orders, setOrders] = useState<Record<string, number>>(
        categories.reduce((acc, cat) => {
            acc[cat.name] = cat.displayOrder;
            return acc;
        }, {} as Record<string, number>)
    );

    const handleOrderChange = (name: string, value: string) => {
        setOrders(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSaveChanges = () => {
        startTransition(async () => {
            const ordersArray = Object.entries(orders).map(([name, order]) => ({ name, order }));
            const result = await updateCategoryOrders(ordersArray);
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: result.message,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message,
                });
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Order</CardTitle>
                <CardDescription>
                    Set the display order for categories on the homepage. Lower numbers appear first.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead className="w-[120px]">Display Order</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.name}>
                                <TableCell className="font-medium capitalize">
                                    {formatCategoryName(category.name)}
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        value={orders[category.name] ?? ''}
                                        onChange={(e) => handleOrderChange(category.name, e.target.value)}
                                        className="h-8"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
        </Card>
    );
}
