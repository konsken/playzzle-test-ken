
// src/app/super-admin/offers/page.tsx
'use server';

import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "../settings/actions";
import { OffersClientPage } from "./offers-client-page";

export default async function SuperAdminOffersPage() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        redirect('/');
    }

    const settings = await getSiteSettings();

    return <OffersClientPage settings={settings} />;
}
