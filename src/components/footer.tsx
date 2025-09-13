
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-y-2">
          <p>&copy; {new Date().getFullYear()} Playzzle. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
             <Link href="/contact" className="hover:text-primary transition-colors">
                Contact
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
             <Link href="/refund-policy" className="hover:text-primary transition-colors">
              Refund Policy
            </Link>
            <Link href="/shipping-policy" className="hover:text-primary transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
