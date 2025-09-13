
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from './contact-form';

export default function ContactPage() {
    const lastUpdatedDate = "July 26, 2024";

    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="text-muted-foreground space-y-4">
                        <p>
                          <strong>Last Updated:</strong> {lastUpdatedDate}
                        </p>
                        <p>
                          Have a question or feedback? We'd love to hear from you. Use the form below or reach out to us directly.
                        </p>
                     </div>
                     <div className="space-y-4 mb-8">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground pt-4">Contact Information</h2>
                            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                                <strong>Playzzle</strong> <br />
                                <strong>Email:</strong> 
                                <a href="mailto:support@creatisk.in" className="text-primary hover:underline">support@creatisk.in</a><br />
                                <strong>Phone:</strong> +91-9653649009<br />
                                <strong>Address:</strong>Nagpur, Maharashtra, India, 440034
                            </p>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold text-foreground pt-4">Support</h2>
                            <p className="text-muted-foreground mt-2">
                                You can use the form below or our support email to get in touch. We typically respond within 24–48 business hours.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-foreground pt-4 border-t">Send us a Message</h2>
                    <p className="text-sm text-muted-foreground mb-4 mt-2">Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.</p>
                    <ContactForm />
                </CardContent>
            </Card>
        </div>
    );
}
