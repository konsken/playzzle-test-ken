
// src/app/account/transaction-history.tsx
import { getTransactions, type Transaction } from './actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatPrice(priceInPaise: number) {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
}

function getPlanName(planId: string) {
    switch (planId) {
        case 'single_puzzle':
            return 'Single Puzzle Credit';
        case 'monthly_pro':
            return 'Monthly Pro';
        case 'yearly_pro':
            return 'Yearly Pro';
        default:
            return planId;
    }
}

export async function TransactionHistory({ userId }: { userId: string }) {
    const { transactions, error } = await getTransactions(userId);

    if (error) {
        // Special handling for missing Firestore index
        if (error.code === 'FAILED_PRECONDITION') {
            const urlMatch = error.message.match(/https?:\/\/[^\s]+/);
            const firestoreIndexUrl = urlMatch ? urlMatch[0] : '#';

            return (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Database Index Required</AlertTitle>
                    <AlertDescription>
                        The transaction query needs a database index to work. Please visit the following URL to create it, then refresh this page.
                        <a 
                            href={firestoreIndexUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-2 block break-all text-xs font-mono underline bg-destructive-foreground/10 p-2 rounded-md"
                        >
                          {firestoreIndexUrl}
                        </a>
                    </AlertDescription>
                </Alert>
            )
        }
        return <p className="text-destructive">Could not load transactions. Please try again later.</p>
    }

    if (!transactions || transactions.length === 0) {
        return <p className="text-muted-foreground">You have no transactions yet.</p>;
    }

    return (
        <TooltipProvider>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx: Transaction) => (
                        <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.createdAt), 'PPP')}</TableCell>
                            <TableCell className="font-medium">
                                <div>{getPlanName(tx.planId)}</div>
                                <div className="text-xs text-muted-foreground break-all">
                                    Order ID: {tx.orderId}
                                </div>
                                {tx.usedForPuzzleId && (
                                    <div className="text-xs text-muted-foreground">
                                        Used for: <span className="font-semibold">{tx.usedForPuzzleId}</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{formatPrice(tx.amount)}</TableCell>
                            <TableCell>
                                {tx.expiry ? format(new Date(tx.expiry), 'PPP') : 'N/A'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={tx.status === 'success' ? 'default' : 'destructive'}>
                                    {tx.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TooltipProvider>
    );
}

