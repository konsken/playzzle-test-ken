
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const analysisData = [
  {
    action: "Purchasing a Membership/Credit",
    requests: 3,
    notes: "One request to create the order, one to record the transaction, and one to load the account page.",
    performance: "Very Fast",
    files: ["/api/razorpay/route.ts", "account/actions.ts (recordTransaction)", "buy-button.tsx"],
  },
  {
    action: "Unlocking a Puzzle with a Credit",
    requests: 1,
    notes: "A single server action handles the entire process of validating and unlocking.",
    performance: "Very Fast",
    files: ["account/actions.ts (useSinglePuzzleCredit)", "puzzle-card.tsx"],
  },
  {
    action: "Initial Page Load (e.g., Home or Puzzles)",
    requests: 1,
    notes: "Standard Next.js page render. Fetches all required data in a single server pass.",
    performance: "Fast",
    files: ["puzzles/page.tsx", "layout.tsx"],
  },
  {
    action: "Visiting a Category Page",
    requests: 1,
    notes: "Efficiently renders the page and its initial set of puzzles in one go.",
    performance: "Fast",
    files: ["category/[category]/page.tsx", "category/[category]/puzzles-grid.tsx"],
  },
  {
    action: "Adding/Removing from Wishlist",
    requests: 1,
    notes: "A single, highly optimized server action updates the user's wishlist.",
    performance: "Very Fast",
    files: ["account/actions.ts (toggleWishlist)", "puzzle-card.tsx"],
  },
  {
    action: "User Login / Signup",
    requests: 2,
    notes: "One request to Firebase Authentication and one to create the server session cookie.",
    performance: "Fast",
    files: ["login/login-form.tsx", "api/auth/session/route.ts"],
  },
  {
    action: "Recording a Solved Puzzle",
    requests: 1,
    notes: "A lightweight server action that fires off to record game history.",
    performance: "Very Fast",
    files: ["dashboard/actions.ts (recordGameCompletion)", "jigsaw-game.tsx"],
  },
];

export default async function RequestAnalysisPage() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
             <Button asChild variant="outline" className="mb-4">
                <Link href="/super-admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Server Request Analysis</h1>
            <p className="text-muted-foreground mb-8">
                A static analysis of key user actions and their estimated impact on server resources.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Benchmark</CardTitle>
                    <CardDescription>
                        This table provides estimates based on the current application code. It helps in understanding the cost and speed of different user flows. "Requests" refers to serverless function invocations on your hosting provider (like Netlify).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Action</TableHead>
                                <TableHead className="text-center">Est. Server Requests</TableHead>
                                <TableHead>Notes & Key Files</TableHead>
                                <TableHead className="text-right">Performance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analysisData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.action}</TableCell>
                                    <TableCell className="text-center font-bold text-lg">{item.requests}</TableCell>
                                    <TableCell className="max-w-md">
                                        <p>{item.notes}</p>
                                        <div className="text-xs text-muted-foreground font-mono mt-2 space-y-1">
                                            {item.files.map(file => <p key={file}>{file}</p>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.performance === "Very Fast" ? "default" : "secondary"}>
                                            <CheckCircle className="w-3 h-3 mr-1.5"/>
                                            {item.performance}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-start gap-4">
                    <Info className="w-8 h-8 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                        <CardTitle className="text-blue-900 dark:text-blue-300">Important Note on Client-Side Actions</CardTitle>
                        <CardDescription className="text-blue-800 dark:text-blue-500">
                            Many actions, like playing a puzzle (moving pieces) or filtering categories on the "Trophy Room" page, happen entirely in the user's browser. These actions do not make any server requests and therefore do not consume your server resources.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}
