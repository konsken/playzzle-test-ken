
'use client';

import { useTransition } from 'react';
import { updateSiteSettings, type SiteSettings } from "../settings/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

export function ContactInfoForm({ initialSettings }: { initialSettings: SiteSettings }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    
    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateSiteSettings({ 
                contactEmail: formData.get('contactEmail') as string,
                contactPhone: formData.get('contactPhone') as string,
                contactAddress: formData.get('contactAddress') as string,
                supportInfoText: formData.get('supportInfoText') as string,
            });

            if (result.success) {
                toast({
                    title: "Success!",
                    description: "Your contact details have been updated.",
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
         <form action={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Contact Page Details</CardTitle>
                    <CardDescription>Update the information displayed on the public "Contact Us" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initialSettings.contactEmail} placeholder="e.g., support@example.com" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={initialSettings.contactPhone} placeholder="e.g., +1-234-567-890" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contactAddress">Contact Address</Label>
                        <Textarea id="contactAddress" name="contactAddress" defaultValue={initialSettings.contactAddress} placeholder="e.g., 123 Puzzle Lane, Funville, 12345" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="supportInfoText">Support Info Text</Label>
                        <Textarea id="supportInfoText" name="supportInfoText" defaultValue={initialSettings.supportInfoText} placeholder="e.g., We typically respond within 24-48 hours." />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Contact Information"}
                    </Button>
                </CardFooter>
            </Card>
         </form>
    );
}
