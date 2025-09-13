
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, MessageSquare, Star, Tags, DollarSign, Settings, Puzzle, Gift, Server, FileText, BarChart2, Zap } from "lucide-react";

export default function SuperAdminPage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Puzzles</CardTitle>
                        <CardDescription>Upload puzzles and manage categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/puzzles">
                                <Puzzle className="mr-2 h-4 w-4" />
                                Go to Puzzles
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Users</CardTitle>
                        <CardDescription>View, edit, and manage all registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/users">
                                <Users className="mr-2 h-4 w-4" />
                                Go to Users
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>View Messages</CardTitle>
                        <CardDescription>Read and manage messages from the contact form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/messages">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                View Messages
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Pro Interest List</CardTitle>
                        <CardDescription>View users interested in Piczzle Pro membership.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/pro-users">
                                <Star className="mr-2 h-4 w-4" />
                                View Interest List
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Memberships</CardTitle>
                        <CardDescription>Edit prices and offers for membership plans.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/membership">
                                <Tags className="mr-2 h-4 w-4" />
                                Edit Plans
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Revenue</CardTitle>
                        <CardDescription>View sales and revenue analytics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/revenue">
                                <DollarSign className="mr-2 h-4 w-4" />
                                View Revenue
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Site Settings</CardTitle>
                        <CardDescription>Manage global site settings and features.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Go to Settings
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Manage Offers</CardTitle>
                        <CardDescription>Control promotional offers on the homepage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/offers">
                                <Gift className="mr-2 h-4 w-4" />
                                Go to Offers
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>Check the status of external services.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/status">
                                <Server className="mr-2 h-4 w-4" />
                                Check Status
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Request Analysis</CardTitle>
                        <CardDescription>Static analysis of server requests per action.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/super-admin/request-analysis">
                                <Zap className="mr-2 h-4 w-4" />
                                View Analysis
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
