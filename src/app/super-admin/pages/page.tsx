
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '../settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

type PageKey = 'contactPageContent' | 'termsPageContent' | 'privacyPageContent' | 'refundPageContent' | 'shippingPageContent';

const pageOptions: { value: PageKey; label: string }[] = [
    { value: 'contactPageContent', label: 'Contact Page Introduction' },
    { value: 'termsPageContent', label: 'Terms of Service' },
    { value: 'privacyPageContent', label: 'Privacy Policy' },
    { value: 'refundPageContent', label: 'Refund & Cancellation Policy' },
    { value: 'shippingPageContent', label: 'Shipping Policy' },
];

export default function ManagePagesPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [selectedPage, setSelectedPage] = useState<PageKey>('termsPageContent');
    const [content, setContent] = useState('');

    useEffect(() => {
        getSiteSettings().then(data => {
            setSettings(data);
            setContent(data[selectedPage]);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (settings) {
            setContent(settings[selectedPage]);
        }
    }, [selectedPage, settings]);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateSiteSettings({ [selectedPage]: content });
            if (result.success) {
                toast({
                    title: 'Success!',
                    description: 'Page content has been updated.',
                });
                // Refetch settings to ensure local state is up-to-date
                 getSiteSettings().then(setSettings);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message,
                });
            }
        });
    };
    
    if (isLoading) {
        return (
             <div className="container mx-auto py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-8">
                     <Skeleton className="h-10 w-48" />
                     <Skeleton className="h-12 w-full" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-96 w-full" />
                        </CardContent>
                         <CardFooter>
                           <Skeleton className="h-10 w-24" />
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <h1 className="text-3xl font-bold">Manage Page Content</h1>
                     <Select value={selectedPage} onValueChange={(v) => setSelectedPage(v as PageKey)}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Select a page to edit" />
                        </SelectTrigger>
                        <SelectContent>
                            {pageOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Editing: {pageOptions.find(p => p.value === selectedPage)?.label}</CardTitle>
                        <CardDescription>
                            Edit the content below. You can use standard HTML tags like `&lt;p&gt;`, `&lt;h2&gt;`, `&lt;ul&gt;`, `&lt;li&gt;`, `&lt;strong&gt;` and `&lt;a&gt;`. 
                            The date will be automatically updated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[500px] font-mono text-xs"
                            placeholder="Enter page content here..."
                        />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Content'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
