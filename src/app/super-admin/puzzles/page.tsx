

// src/app/super-admin/puzzles/page.tsx
import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { redirect } from "next/navigation";
import { getCategories, Category } from "@/app/puzzles/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryOrderManager } from "./category-order-manager";

export default async function SuperAdminPuzzlesPage() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        redirect('/');
    }
    
    const categories = await getCategories();
    
    return (
        <div className="container mx-auto py-8 px-4">
             <div className="max-w-4xl mx-auto">
                <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold mb-2">Manage Puzzles & Categories</h1>
                <p className="text-muted-foreground mb-8">
                    Organize puzzle categories and their display order on the homepage.
                </p>

                <CategoryOrderManager categories={categories} />
             </div>
        </div>
    );
}
