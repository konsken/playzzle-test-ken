
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundPolicyPage() {
    const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="container mx-auto py-8 px-4">
            <Card>
                <CardHeader>
                <CardTitle className="text-3xl">Refund & Cancellation Policy</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                          <strong>Last Updated:</strong> {lastUpdatedDate}
                        </p>

                        <h2 className="text-xl font-semibold text-foreground pt-4">General Policy</h2>
                        <p>
                          Thank you for choosing Playzzle. Our policy on refunds and cancellations is designed to be clear and fair. As our products are digital and provide immediate access, our policies reflect this.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground pt-4">Cancellations</h2>
                        <p>
                          You can cancel your Pro Membership subscription at any time. To cancel, please navigate to your "Account" page and follow the instructions in the "Subscription" tab.
                        </p>
                        <p>
                          When you cancel a subscription, you will continue to have access to all Pro features until the end of your current billing period. Your subscription will not be renewed, and you will not be charged again.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground pt-4">Refunds</h2>
                        <p>
                          <strong>All purchases made on Playzzle are final and non-refundable.</strong> This includes Pro Membership subscriptions (both monthly and yearly) and Single Puzzle Credits.
                        </p>
                        <p>
                          Because our services provide immediate, digital access to content, we do not offer refunds once a purchase is made. When you purchase a subscription or a credit, you are granted immediate access to the benefits, and this access cannot be revoked.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground pt-4">Exceptional Circumstances</h2>
                        <p>
                          We may consider refunds on a case-by-case basis under exceptional circumstances, such as a billing error on our part. If you believe there has been a mistake with your billing, please contact us immediately through our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
                        </p>
                         <p>
                          Providing a detailed description of the issue will help us resolve it more quickly. Please note that submitting a request does not guarantee a refund, and all decisions are at our sole discretion.
                        </p>

                        <h2 className="text-xl font-semibold text-foreground pt-4">Contact Us</h2>
                        <p>
                          If you have any questions about our Refund & Cancellation Policy, please do not hesitate to reach out to us via our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
