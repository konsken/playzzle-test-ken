

'use client';

import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Text } from 'lucide-react';
import type { SiteSettings, PuzzleNameDisplay } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateSiteSettings } from './actions';

export function SettingsClientPage({ settings: initialSettings }: { settings: SiteSettings }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateSiteSettings({ 
            mobilePlayEnabled: formData.get('mobilePlayEnabled') === 'on',
            puzzleNameDisplay: formData.get('puzzleNameDisplay') as any,
            puzzleGenericName: formData.get('puzzleGenericName') as string,
            trophyRoomIsPro: formData.get('trophyRoomIsPro') === 'on',
            interestFormEnabled: formData.get('interestFormEnabled') === 'on',
        });
        
        if (result.success) {
            toast({
                title: "Success!",
                description: result.message,
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

  const handleNameDisplayChange = (value: PuzzleNameDisplay) => {
    setSettings(prev => ({...prev, puzzleNameDisplay: value}));
  }

  return (
    <form action={handleFormSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>Manage global settings for the puzzle experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="mobilePlayEnabled" className="text-base">
                            Enable Mobile Gameplay
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Allow users to play puzzles on mobile phones.
                        </p>
                    </div>
                     <Switch
                        id="mobilePlayEnabled"
                        name="mobilePlayEnabled"
                        defaultChecked={settings.mobilePlayEnabled}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="trophyRoomIsPro" className="text-base">
                            Make Trophy Room a Pro Feature
                        </Label>
                        <p className="text-sm text-muted-foreground">
                           If enabled, only Pro users can access the Trophy Room.
                        </p>
                    </div>
                     <Switch
                        id="trophyRoomIsPro"
                        name="trophyRoomIsPro"
                        defaultChecked={settings.trophyRoomIsPro}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="interestFormEnabled" className="text-base">
                            Enable Interest Form
                        </Label>
                        <p className="text-sm text-muted-foreground">
                           Show the "Be the First to Know" form on the membership page.
                        </p>
                    </div>
                     <Switch
                        id="interestFormEnabled"
                        name="interestFormEnabled"
                        defaultChecked={settings.interestFormEnabled}
                    />
                </div>
                 <div className="space-y-3 rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2">
                        <Text className="w-5 h-5" />
                        Puzzle Display Name
                        </Label>
                        <p className="text-sm text-muted-foreground">
                        Choose how puzzle names are displayed across the site.
                        </p>
                    </div>
                    <Select name="puzzleNameDisplay" value={settings.puzzleNameDisplay} onValueChange={handleNameDisplayChange}>
                        <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a display format" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="formatted">Formatted Title (e.g., "Bengal Cat")</SelectItem>
                        <SelectItem value="generic">Generic Title (e.g., "Puzzle")</SelectItem>
                        <SelectItem value="filename">Original Filename (e.g., "_pro_bengal-cat.jpg")</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {settings.puzzleNameDisplay === 'generic' && (
                        <div className="space-y-2 pt-2">
                        <Label htmlFor="puzzleGenericName">Custom Generic Name</Label>
                        <Input 
                            id="puzzleGenericName"
                            name="puzzleGenericName" 
                            defaultValue={settings.puzzleGenericName} 
                            placeholder="e.g., My Awesome Puzzle"
                        />
                        <p className="text-xs text-muted-foreground">
                            This name will be used when "Generic Title" is selected.
                        </p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Settings'}
                </Button>
            </CardFooter>
        </Card>
    </form>
  );
}
