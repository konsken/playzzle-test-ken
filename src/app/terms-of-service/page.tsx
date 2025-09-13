

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Last Updated:</strong> {lastUpdatedDate}
                </p>
                <p>
                  Welcome to Playzzle! These Terms of Service ("Terms") govern your use of our website and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">1. Accounts</h2>
                <p>
                  When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">2. Subscriptions and Purchases</h2>
                <p>
                  Some parts of the Service are billed on a subscription basis ("Subscription(s)") or as a one-time purchase. You will be billed in advance on a recurring and periodic basis for Subscriptions (e.g., monthly or yearly) or at the time of purchase for one-time credits.
                </p>
                <p>
                  All payments are handled by our third-party payment processor, Razorpay. We do not store your payment card details.
                </p>
                <p>
                  <strong>Cancellations & Refunds:</strong> You may cancel your Subscription at any time through your account page. For detailed information on our policies, please see our <a href="/refund-policy" className="text-primary hover:underline">Refund and Cancellation Policy</a>. All purchases are final and non-refundable except under specific circumstances outlined in the policy.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">3. Intellectual Property</h2>
                <p>
                  The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Playzzle. Our puzzles, branding, and all related assets are protected by copyright and trademark laws.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">4. Termination</h2>
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">5. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.
                </p>
                 <h2 className="text-xl font-semibold text-foreground pt-4">6. Contact Us</h2>
                 <p>
                  If you have any questions about these Terms, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
                 </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
