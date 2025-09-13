'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import Razorpay from 'razorpay';

type ServiceStatus = {
    status: 'connected' | 'error' | 'warning';
    message: string;
};

// 1. Check Firebase Firestore connection
export async function checkFirestoreStatus(): Promise<ServiceStatus> {
    console.log('[SERVER ACTION] checkFirestoreStatus');
    try {
        const db = getFirestore(app);
        // Attempt to get a non-existent document. This is a very low-cost read.
        // If it doesn't throw, the connection is good.
        await db.collection('__healthcheck').doc('status').get();
        
        return {
            status: 'connected',
            message: 'Successfully connected to the Firebase Firestore database.'
        };
    } catch (error: any) {
        console.error('Firestore connection check failed:', error);
        return {
            status: 'error',
            message: `Failed to connect to Firestore. Error: ${error.message}`
        };
    }
}

// 2. Check Razorpay configuration and connection
export async function checkRazorpayStatus(): Promise<ServiceStatus> {
    console.log('[SERVER ACTION] checkRazorpayStatus');
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();

    if (!keyId) {
        return {
            status: 'error',
            message: 'Server-side Razorpay Key ID is not configured. Please set the RAZORPAY_KEY_ID environment variable on your hosting provider.'
        };
    }
    if (!keySecret) {
        return {
            status: 'error',
            message: 'Server-side Razorpay Key Secret is not configured. Please set the RAZORPAY_KEY_SECRET environment variable on your hosting provider.'
        };
    }
     if (!publicKeyId) {
        return {
            status: 'error',
            message: 'Client-side public Razorpay Key ID is not configured. Please set the NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable on your hosting provider.'
        };
    }
     if (keyId !== publicKeyId) {
        return {
            status: 'warning',
            message: 'Key Mismatch: The server-side RAZORPAY_KEY_ID and the client-side NEXT_PUBLIC_RAZORPAY_KEY_ID do not match. This will cause payments to fail.'
        };
    }
    
    try {
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Attempt a simple, read-only API call to verify the keys are valid.
        // Fetching the last 1 order is a good way to do this.
        await razorpay.orders.all({ count: 1 });

        return {
            status: 'connected',
            message: 'Successfully connected to Razorpay. Server and Client API keys are valid and match.'
        };
    } catch (error: any)
      {
        console.error('Razorpay connection check failed:', error);
        
        // Provide specific feedback for common authentication errors
        if (error.statusCode === 401) {
             return {
                status: 'error',
                message: 'Connection to Razorpay failed. The provided API Key ID or Key Secret is incorrect. Please verify your environment variables.'
            };
        }

        return {
            status: 'error',
            message: `Failed to connect to Razorpay. Error: ${error.error?.description || error.message}`
        };
    }
}
