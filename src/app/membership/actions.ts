'use server';

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { revalidatePath } from 'next/cache';

const interestFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
});

export type InterestFormState = {
    message: string;
    status: 'success' | 'error';
} | {
    message: null;
    status: null;
}

export async function submitInterestForm(
    prevState: InterestFormState,
    formData: FormData
): Promise<InterestFormState> {
    console.log('[SERVER ACTION] submitInterestForm');
    const validatedFields = interestFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid form data. Please check your entries.',
            status: 'error',
        };
    }
    
    const { name, email } = validatedFields.data;

    try {
        const db = getFirestore(app);
        
        // Check if email already exists
        const snapshot = await db.collection('proInterestSubmissions').where('email', '==', email).limit(1).get();
        if (!snapshot.empty) {
            return {
                message: 'This email has already been registered. Thank you!',
                status: 'success', // Treat as success to the user
            };
        }

        await db.collection('proInterestSubmissions').add({
            name,
            email,
            createdAt: new Date(),
        });
        
        revalidatePath('/super-admin/pro-users');

        return {
            message: "Thank you for your interest! We'll notify you when Playzzle Pro is live.",
            status: 'success',
        };
    } catch (error) {
        console.error('Error submitting interest form:', error);
        return {
            message: 'An unexpected error occurred. Please try again later.',
            status: 'error',
        };
    }
}
