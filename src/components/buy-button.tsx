
// src/components/buy-button.tsx
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import { recordTransaction } from '@/app/account/actions';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';


declare global {
  interface Window {
    Razorpay: any;
  }
}

type BuyButtonProps = {
  amount: number;
  planId: string;
  puzzleId?: string;
  user: AuthenticatedUser | null;
  children: React.ReactNode;
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function BuyButton({ amount, planId, puzzleId, user, children }: BuyButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setIsLoading(true);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to make a purchase.',
      });
      setIsLoading(false);
      router.push('/login');
      return;
    }

    const hasLoaded = await loadRazorpayScript();
    if (!hasLoaded) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load payment gateway. Please check your connection and try again.',
      });
      setIsLoading(false);
      return;
    }

    let order;
    try {
      // Step 1: Create an order on the server
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, planId, puzzleId }),
      });
      
      order = await response.json();

      // Explicitly check for a failed response or a missing order ID
      if (!response.ok || !order.id) {
        throw new Error(order.error || 'Failed to create payment order. Check server logs.');
      }
    } catch (error: any) {
      // Log the specific error to the browser console for debugging
      console.error('Order creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Initialization Failed',
        description: error.message || 'Could not connect to the payment server. Please try again.',
      });
      setIsLoading(false);
      return; // Stop execution if order creation fails
    }


    // Step 2: Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Playzzle Pro',
      description: `Payment for ${planId}`,
      order_id: order.id,
      handler: async function (response: any) {
        // 3. Handle successful payment
        try {
            const transactionData = {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                amount: order.amount,
                currency: order.currency,
                planId: planId,
                puzzleId: puzzleId,
                status: 'success',
            };
            
            await recordTransaction(transactionData);
            
            toast({
                title: 'Payment Successful!',
                description: 'Thank you for your purchase. Your access has been updated.',
            });
            
            // Redirect to account page to see updated status
            router.push('/account');

        } catch (serverError: any) {
             toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: serverError.message || 'Could not verify payment. Please contact support.',
            });
        } finally {
            setIsLoading(false);
        }
      },
      prefill: {
        name: currentUser.displayName || '',
        email: currentUser.email || '',
      },
      modal: {
          ondismiss: function() {
              // This function is called when the customer closes the modal
              setIsLoading(false);
          }
      },
      events: {
        'payment.failed': async function (response: any) {
          try {
              await recordTransaction({
                  paymentId: response.error.metadata.payment_id,
                  orderId: response.error.metadata.order_id,
                  amount: order.amount,
                  currency: order.currency,
                  planId,
                  puzzleId,
                  status: 'failed',
                  failureReason: response.error.description,
              });
          } finally {
              toast({
                  variant: 'destructive',
                  title: 'Payment Failed',
                  description: response.error.description,
              });
               setIsLoading(false);
          }
        }
      },
      theme: {
        color: '#3b82f6',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    // Do not set isLoading to false here, as the modal's ondismiss will handle it.
  };

  return (
    <Button onClick={handlePayment} className="w-full" disabled={isLoading}>
      {isLoading ? 'Processing...' : children}
    </Button>
  );
}
