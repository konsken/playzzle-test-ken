// src/app/account/credits-display.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";


export function CreditsDisplay({ creditCount }: { creditCount: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Puzzle Credits</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                        <Ticket className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{creditCount}</p>
                            <p className="text-sm text-muted-foreground">Single Puzzle Credits Available</p>
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/membership">
                            Buy More Credits
                        </Link>
                    </Button>
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Lifetime Access</AlertTitle>
                  <AlertDescription>
                    Puzzles unlocked with credits are yours to keep forever, regardless of your Pro membership status.
                  </AlertDescription>
                </Alert>

                {creditCount === 0 && (
                    <p className="text-center text-muted-foreground mt-4">
                        You have no puzzle credits. Purchase credits to unlock individual Pro puzzles.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
