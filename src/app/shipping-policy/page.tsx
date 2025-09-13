

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShippingPolicyPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Shipping Policy</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Last Updated:</strong> {lastUpdatedDate}
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">Digital Delivery of Services</h2>
                <p>
                  Delivery of our services will be confirmed on your email ID as specified during registration. All products and services sold on Playzzle are digital and delivered electronically. As there are no physical goods, the clauses regarding physical shipping, courier services, and delivery to a physical address are not applicable.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">Order Processing</h2>
                <p>
                  Orders for our digital services are processed immediately after payment confirmation. Access is granted instantly, as per the details agreed upon at the time of order confirmation.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">Instant Access and Delivery</h2>
                 <ul className="list-disc pl-6 space-y-2">
                      <li>
                          <strong>Pro Memberships:</strong> Your account is upgraded immediately, granting you instant access to all Pro features.
                      </li>
                      <li>
                          <strong>Single Puzzle Credits:</strong> A credit is added to your account instantly upon successful payment.
                      </li>
                 </ul>

                <h2 className="text-xl font-semibold text-foreground pt-4">No Liability for Delay</h2>
                <p>
                  As delivery is instant and digital, KAPIL KHEMRAO KOSARE is not liable for delays caused by technical issues outside of our direct control, such as email provider problems or internet connectivity issues on the user's end. We guarantee to make the service available from our end immediately upon successful payment.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">Contact and Support</h2>
                <p>
                  For any issues in utilizing our services, please reach out to us via our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
