
import { getAuthenticatedUser } from "@/lib/firebase/server-auth";
import { redirect } from "next/navigation";
import { getMembershipPlans } from "./actions";
import { EditPlanForm } from "./edit-plan-form";
import { AddPlanForm } from "./add-plan-form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SuperAdminMembershipPage() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        redirect('/');
    }

    const plans = await getMembershipPlans();

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href="/super-admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold mb-2">Manage Membership Plans</h1>
                <p className="text-muted-foreground mb-8">
                    Update prices for the membership tiers. The changes will be reflected on the public membership page immediately.
                </p>

                <div className="space-y-8">
                    {plans.map((plan) => (
                        <EditPlanForm key={plan.id} plan={plan} />
                    ))}
                </div>

                <Separator className="my-12" />

                <AddPlanForm />
            </div>
        </div>
    );
}
