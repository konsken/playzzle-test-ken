

// src/app/super-admin/settings/page.tsx
'use server';

import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsClientPage } from "./settings-client-page";

export default async function SuperAdminSettingsPage() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        redirect('/');
    }

    const settings = await getSiteSettings();

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-2xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                 <h1 className="text-3xl font-bold mb-8">Site Settings</h1>
                 
                 <SettingsClientPage settings={settings} />

            </div>
        </div>
    );
}
