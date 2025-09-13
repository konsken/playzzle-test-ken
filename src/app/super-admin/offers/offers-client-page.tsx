
'use client';

import { useTransition } from 'react';
import { updateSiteSettings, type SiteSettings } from "../settings/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

export function OffersClientPage({ settings }: { settings: SiteSettings }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateSiteSettings({ 
                offerEnabled: formData.get('offerEnabled') === 'on',
                offerTitle: formData.get('offerTitle') as string,
                offerDescription: formData.get('offerDescription') as string,
                offerShopNowText: formData.get('offerShopNowText') as string,
            });

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Offer settings have been updated.",
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        });
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-2xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                 <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Gift className="w-8 h-8"/> Manage Homepage Offer</h1>
                 <form action={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Promotional Offer Settings</CardTitle>
                            <CardDescription>Control the offer displayed on the main landing page. This grants a Free 1-Month Pro Membership to new users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="offerEnabled" className="text-base">
                                        Enable Offer
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show or hide the promotional offer section on the homepage.
                                    </p>
                                </div>
                                 <Switch
                                    id="offerEnabled"
                                    name="offerEnabled"
                                    defaultChecked={settings.offerEnabled}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="offerShopNowText">Tag Text</Label>
                                <Input id="offerShopNowText" name="offerShopNowText" defaultValue={settings.offerShopNowText} placeholder="e.g., SHOP NOW" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="offerTitle">Offer Title</Label>
                                <Input id="offerTitle" name="offerTitle" defaultValue={settings.offerTitle} placeholder="e.g., Limited Time Offer!" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="offerDescription">Offer Description</Label>
                                <Textarea id="offerDescription" name="offerDescription" defaultValue={settings.offerDescription} placeholder="e.g., Get one month of Pro for free when you sign up." />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Offer Settings"}</Button>
                        </CardFooter>
                    </Card>
                 </form>
            </div>
        </div>
    );
}

