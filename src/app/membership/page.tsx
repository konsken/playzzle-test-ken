

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, BadgePercent } from 'lucide-react';
import { InterestForm } from './interest-form';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import BuyButton from '@/components/buy-button';
import { getMembershipPlans, MembershipPlan } from '@/app/super-admin/membership/actions';
import { Badge } from '@/components/ui/badge';
import { getSiteSettings } from '../super-admin/settings/actions';

const proFeatures = [
    "A new, exclusive puzzle delivered every day.",
    "Play unlimited puzzles",
    "Access to special 'Pro' puzzle collections.",
    "An ad-free experience.",
];

function formatPrice(priceInPaise: number) {
    return `₹${priceInPaise / 100}`;
}


export default async function MembershipPage() {
    const [user, subscriptionPlans, settings] = await Promise.all([
        getAuthenticatedUser(),
        getMembershipPlans(),
        getSiteSettings()
    ]);
    const { interestFormEnabled } = settings;

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <Star className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Playzzle Pro Membership</h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10">
                    Elevate your puzzle experience. Choose a plan that works for you and unlock exclusive features.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
                {subscriptionPlans.map((plan) => (
                    <Card key={plan.title} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-center gap-2">
                                <CardTitle>{plan.title}</CardTitle>
                                {plan.offerPrice && (
                                    <Badge variant="destructive" className="whitespace-nowrap">SPECIAL OFFER</Badge>
                                )}
                            </div>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                             <div className="mb-4">
                                {plan.offerPrice ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold">{formatPrice(plan.offerPrice)}</span>
                                        <span className="text-xl font-medium text-muted-foreground line-through">{formatPrice(plan.price)}</span>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold">{formatPrice(plan.price)}</div>
                                )}
                            </div>
                            <ul className="space-y-2 text-muted-foreground mb-6 flex-grow">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <BuyButton 
                                amount={plan.offerPrice || plan.price} 
                                planId={plan.planId} 
                                user={user}
                                puzzleId={plan.planId === 'single_puzzle' ? 'pro_puzzle_purchase' : undefined}
                            >
                                Get Started
                            </BuyButton>
                        </CardContent>
                    </Card>
                ))}
            </div>


            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>What's Included in Pro?</CardTitle>
                    <CardDescription>Unlock the ultimate Piczzle experience.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {proFeatures.map((feature, index) => (
                             <li key={index} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {interestFormEnabled && <InterestForm />}
        </div>
    );
}
