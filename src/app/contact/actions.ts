'use server';

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/lib/firebase/admin-config';
import { revalidatePath } from 'next/cache';

// This schema can be used for other server-side operations if needed,
// but for the form, the client-side validation is now the primary source of truth.
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export type ContactFormState = {
    message: string;
    status: 'success' | 'error';
} | {
    message: null;
    status: null;
}

export async function submitContactForm(
    prevState: ContactFormState,
    formData: FormData
): Promise<ContactFormState> {
    console.log('[SERVER ACTION] submitContactForm');
    // Client-side validation is now the source of truth, 
    // especially for the captcha. We can still do a light check here.
    const data = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
    };
    
    // Basic check to ensure data is present
    if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message) {
        return {
            message: 'Invalid form data. Please fill out all fields.',
            status: 'error',
        };
    }

    try {
        const db = getFirestore(app);
        await db.collection('contactSubmissions').add({
            ...data,
            createdAt: new Date(),
            read: false,
        });
        
        revalidatePath('/super-admin/messages');

        return {
            message: 'Thank you for your message! We will get back to you soon.',
            status: 'success',
        };
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return {
            message: 'An unexpected error occurred. Please try again later.',
            status: 'error',
        };
    }
}
