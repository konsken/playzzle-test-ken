
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Last Updated:</strong> {lastUpdatedDate}
                </p>
                <p>
                  Welcome to Playzzle ("we", "us", "our"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
                </p>

                <h2 className="text-xl font-semibold text-foreground pt-4">1. Information We Collect</h2>
                <p>We may collect information about you in a variety of ways. The information we may collect on the Service includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                      <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information (like your date of birth), that you voluntarily give to us when you register with the application.
                  </li>
                  <li>
                      <strong>Payment Data:</strong> We do not store any payment information. All payments are processed by our third-party payment processor, Razorpay. We encourage you to review their privacy policy and contact them directly for responses to your questions.
                  </li>
                  <li>
                      <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your game history (puzzles solved, time taken, moves made), which is linked to your user account.
                  </li>
                   <li>
                      <strong>Data from Social Networks:</strong> If you choose to connect your account to social networking services (e.g., Google), we may collect information from your social network account, such as your name, profile picture, and email address.
                  </li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground pt-4">2. Use of Your Information</h2>
                <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:</p>
                 <ul className="list-disc pl-6 space-y-2">
                      <li>Create and manage your account.</li>
                      <li>Process your transactions and subscriptions.</li>
                      <li>Email you regarding your account or order.</li>
                      <li>Generate a personal profile about you to make future visits to the application more personalized.</li>
                      <li>Monitor and analyze usage and trends to improve your experience with the application.</li>
                      <li>Respond to customer service requests.</li>
                  </ul>

                <h2 className="text-xl font-semibold text-foreground pt-4">3. Third-Party Service Providers</h2>
                <p>We use third-party services to help us operate our application and provide our services. These services have their own privacy policies.</p>
                 <ul className="list-disc pl-6 space-y-2">
                      <li>
                          <strong>Firebase (by Google):</strong> We use Firebase for backend services, including authentication, database storage (Firestore), and hosting. You can review Google's privacy policy <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">here</a>.
                      </li>
                       <li>
                          <strong>Razorpay:</strong> We use Razorpay for payment processing. We do not store your financial information. Razorpay's privacy policy can be found on their website.
                      </li>
                 </ul>


                <h2 className="text-xl font-semibold text-foreground pt-4">4. Security of Your Information</h2>
                <p>
                  We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>

                 <h2 className="text-xl font-semibold text-foreground pt-4">5. Your Rights</h2>
                  <p>You have the right to:</p>
                   <ul className="list-disc pl-6 space-y-2">
                      <li>Request access to the personal data we hold about you.</li>
                      <li>Request that we correct or delete your personal data. You can manage your profile information from your account page. For account deletion, please use the option provided in your account settings.</li>
                      <li>Object to our processing of your personal data.</li>
                  </ul>

                <h2 className="text-xl font-semibold text-foreground pt-4">6. Contact Us</h2>
                <p>
                  If you have questions or comments about this Privacy Policy, please contact us through the <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
                </p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
