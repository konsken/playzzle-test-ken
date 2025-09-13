// src/app/api/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { headers } from 'next/headers';

// Helper to get detailed request info
function getRequestDetails(request: NextRequest) {
    const heads = headers();
    const ip = request.ip || heads.get('x-forwarded-for') || 'unknown';
    const userAgent = heads.get('user-agent') || 'unknown';
    return {
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
        method: request.method,
        ip,
        userAgent,
    };
}


export async function POST(request: NextRequest) {
  const requestDetails = getRequestDetails(request);
  console.log('[API] POST /api/razorpay - Request Details:', JSON.stringify(requestDetails));

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trim potential whitespace from environment variables
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  // Detailed server-side logging for verification
  if (!keyId || !keySecret) {
    console.error('Razorpay API keys are not set or are empty in the server environment.');
    if (!keyId) console.error('CRITICAL: RAZORPAY_KEY_ID is missing from environment variables.');
    if (!keySecret) console.error('CRITICAL: RAZORPAY_KEY_SECRET is missing from environment variables.');
    return NextResponse.json({ error: 'Server configuration error: Payment processing is not configured.' }, { status: 500 });
  } else {
      // This log confirms the keys are loaded. You can check this in your Netlify function logs.
      console.log('Razorpay API keys loaded successfully.');
  }
  
  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    
    const { amount, planId, puzzleId } = await request.json();

    if (!amount || !planId) {
      return NextResponse.json({ error: 'Amount and Plan ID are required' }, { status: 400 });
    }

    const options = {
      amount, // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `rcpt_${user.uid.slice(0, 8)}_${Date.now()}`, // Shortened receipt
      notes: {
        userId: user.uid,
        userEmail: user.email,
        planId: planId,
        puzzleId: puzzleId || 'N/A',
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    // Send back a more specific error message to the client
    const errorMessage = error?.error?.description || 'Failed to create Razorpay order. Please check server logs and API keys.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
