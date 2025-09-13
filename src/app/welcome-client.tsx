
'use client';

import { Button } from '@/components/ui/button';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type WelcomeClientProps = {
    user: AuthenticatedUser | null;
    offerEnabled: boolean;
    offerTitle: string;
    offerDescription: string;
    offerShopNowText: string;
}

export function WelcomeClient({ user, offerEnabled, offerTitle, offerDescription, offerShopNowText }: WelcomeClientProps) {

    return (
        <>
            <div>
                {user ? (
                    <Button asChild size="lg">
                        <Link href="/puzzles">
                            Explore Puzzles <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg">
                            <Link href="/login">
                                Log In
                            </Link>
                        </Button>
                         <Button asChild size="lg" variant="outline">
                            <Link href="/signup">
                                Sign Up
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
            
            {offerEnabled && !user && (
                 <Link href="/signup" className="fixed bottom-8 right-8 z-50 group">
                    <div
                        className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center text-center p-4 shadow-2xl transition-transform group-hover:scale-110 bg-white border-8 border-offer-yellow"
                    >
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary"></div>
                        
                        <div className="absolute -top-4 bg-offer-yellow px-3 py-1 rounded-md">
                            <span className="text-sm font-bold text-black tracking-wider">{offerShopNowText}</span>
                        </div>
                        
                        <div className="relative text-black">
                             <p className="text-2xl font-extrabold text-offer-red uppercase" style={{ WebkitTextStroke: '1px black' }}>{offerTitle}</p>
                            <p className="text-xs font-semibold italic">{offerDescription}</p>
                        </div>
                    </div>
                </Link>
            )}
        </>
    )
}
