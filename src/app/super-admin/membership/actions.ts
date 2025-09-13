'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { app } from '@/lib/firebase/admin-config';
import { getAuthenticatedUser } from '@/lib/firebase/server-auth';

async function verifyAdmin() {
    const user = await getAuthenticatedUser();
    if (!user || !user.customClaims?.superadmin) {
        throw new Error('Not authorized');
    }
}

const initialPlans = [
    {
        planId: 'single_puzzle',
        title: 'Single Pro Puzzle',
        description: 'Unlock one premium puzzle of your choice.',
        features: ['Access to one Pro puzzle', 'Perfect for a quick challenge'],
        price: 3000,
        displayOrder: 1,
        offerPrice: null,
    },
    {
        planId: 'monthly_pro',
        title: 'Monthly Pro',
        description: 'Unlimited access to all pro features for a month.',
        features: ['All Pro features included', 'New puzzles daily', 'Cancel anytime'],
        price: 10000,
        displayOrder: 2,
        offerPrice: null,
    },
    {
        planId: 'yearly_pro',
        title: 'Yearly Pro',
        description: 'Get the best value with a full year of Pro access.',
        features: ['All Pro features included', 'Save over 50% compared to monthly', 'Priority support'],
        price: 50000,
        displayOrder: 3,
        offerPrice: null,
    },
];

export type MembershipPlan = {
    id: string;
    planId: string;
    title: string;
    description: string;
    features: string[];
    price: number;
    offerPrice: number | null;
    displayOrder: number;
};


export async function getMembershipPlans(): Promise<MembershipPlan[]> {
    console.log('[SERVER ACTION] getMembershipPlans');
    const db = getFirestore(app);
    const plansRef = db.collection('membershipPlans');
    let snapshot = await plansRef.get();

    // If no plans exist, create them
    if (snapshot.empty) {
        const batch = db.batch();
        initialPlans.forEach(plan => {
            const docRef = plansRef.doc(plan.planId);
            batch.set(docRef, plan);
        });
        await batch.commit();
        snapshot = await plansRef.get();
    }

    const plans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as MembershipPlan[];
    
    return plans.sort((a, b) => a.displayOrder - b.displayOrder);
}

const updatePlanSchema = z.object({
  price: z.coerce.number().min(0, "Price must be positive."),
  offerPrice: z.coerce.number().min(0, "Offer price must be positive.").optional().nullable(),
});

export type UpdatePlanState = {
    message: string;
    status: 'success' | 'error';
    fieldErrors?: Record<string, string>;
} | {
    message: null;
    status: null;
    fieldErrors?: null;
}


export async function updatePlan(planId: string, prevState: UpdatePlanState, formData: FormData): Promise<UpdatePlanState> {
    console.log('[SERVER ACTION] updatePlan');
    await verifyAdmin();

    const rawData = {
        price: formData.get('price'),
        offerPrice: formData.get('offerPrice') || null,
    };

    const validatedFields = updatePlanSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Invalid input.',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    let { price, offerPrice } = validatedFields.data;

    // Convert to paise
    price = price * 100;
    if (offerPrice) {
        offerPrice = offerPrice * 100;
    }
    
    if (offerPrice && offerPrice >= price) {
        return {
            status: 'error',
            message: 'Offer price must be less than the original price.',
        };
    }
    
    try {
        const db = getFirestore(app);
        await db.collection('membershipPlans').doc(planId).update({
            price: price,
            offerPrice: offerPrice || null,
        });

        revalidatePath('/super-admin/membership');
        revalidatePath('/membership');
        
        return {
            status: 'success',
            message: 'Plan updated successfully!',
        };

    } catch(error) {
        console.error("Error updating plan:", error);
        return {
            status: 'error',
            message: 'An unexpected error occurred.',
        };
    }
}


export async function deletePlan(planId: string): Promise<{success: boolean, message: string}> {
    console.log('[SERVER ACTION] deletePlan');
    await verifyAdmin();
    
    // Safety check to prevent deleting core plans needed for logic
    if (['single_puzzle', 'monthly_pro', 'yearly_pro'].includes(planId)) {
        return { success: false, message: "This core plan cannot be deleted." };
    }

    try {
        const db = getFirestore(app);
        await db.collection('membershipPlans').doc(planId).delete();
        revalidatePath('/super-admin/membership');
        revalidatePath('/membership');
        return { success: true, message: 'Plan deleted successfully.' };
    } catch(error) {
        console.error("Error deleting plan:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}

const addPlanSchema = z.object({
    planId: z.string().min(3, "Plan ID must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Plan ID can only contain lowercase letters, numbers, and underscores."),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    displayOrder: z.coerce.number().int("Display order must be a whole number."),
    features: z.string().min(1, "Please provide at least one feature.").transform(val => val.split('\n').map(s => s.trim()).filter(Boolean)),
});


export async function addPlan(prevState: UpdatePlanState, formData: FormData): Promise<UpdatePlanState> {
    console.log('[SERVER ACTION] addPlan');
    await verifyAdmin();

    const validatedFields = addPlanSchema.safeParse({
        planId: formData.get('planId'),
        title: formData.get('title'),
        description: formData.get('description'),
        price: formData.get('price'),
        displayOrder: formData.get('displayOrder'),
        features: formData.get('features'),
    });

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Invalid data. Please check the form.',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        }
    }
    
    const { planId, ...planData } = validatedFields.data;

    try {
        const db = getFirestore(app);
        const planRef = db.collection('membershipPlans').doc(planId);
        
        const doc = await planRef.get();
        if (doc.exists) {
            return {
                status: 'error',
                message: `A plan with the ID '${planId}' already exists.`,
            }
        }
        
        await planRef.set({
            ...planData,
            planId, // Also store the planId in the document
            price: planData.price * 100, // convert to paise
            offerPrice: null, // new plans don't have an offer price by default
        });
        
        revalidatePath('/super-admin/membership');
        revalidatePath('/membership');

        return {
            status: 'success',
            message: 'New plan added successfully!'
        };
    } catch(error) {
        console.error("Error adding new plan:", error);
        return {
            status: 'error',
            message: 'An unexpected error occurred while adding the plan.',
        };
    }
}
