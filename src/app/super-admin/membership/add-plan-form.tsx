
'use client';

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { addPlan, type UpdatePlanState } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const addPlanSchema = z.object({
    planId: z.string().min(3, "Plan ID must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Plan ID can only contain lowercase letters, numbers, and underscores."),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().min(0, "Price must be a positive number."),
    displayOrder: z.coerce.number().int("Display order must be a whole number."),
    features: z.string().min(1, "Please provide at least one feature."),
});


export function AddPlanForm() {
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<z.infer<typeof addPlanSchema>>({
        resolver: zodResolver(addPlanSchema),
        defaultValues: {
            planId: "",
            title: "",
            description: "",
            price: 0,
            displayOrder: 4,
            features: ""
        }
    });

    const onSubmit = (values: z.infer<typeof addPlanSchema>) => {
        startTransition(async () => {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
            
            const result = await addPlan({message: null, status: null}, formData);

            toast({
                title: result.status === 'success' ? 'Success!' : 'Error',
                description: result.message,
                variant: result.status === 'error' ? 'destructive' : 'default',
            });
            if (result.status === 'success') {
                form.reset();
            }
             if (result.fieldErrors) {
                 for (const [fieldName, message] of Object.entries(result.fieldErrors)) {
                    if (message) {
                        form.setError(fieldName as keyof z.infer<typeof addPlanSchema>, { type: 'manual', message: message[0] });
                    }
                }
            }
        });
    }


    return (
        <Card>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                    <CardTitle>Add New Membership Plan</CardTitle>
                    <CardDescription>Create a new plan that users can subscribe to.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid sm:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="planId"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Plan ID</Label>
                                    <FormControl>
                                        <Input placeholder="e.g., premium_quarterly" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                         <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Title</Label>
                                    <FormControl>
                                        <Input placeholder="e.g., Quarterly Pro" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                    </div>
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Description</Label>
                                <FormControl>
                                    <Input placeholder="A short summary of the plan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                    <div className="grid sm:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Price (in INR)</Label>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="displayOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Display Order</Label>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                            <FormItem>
                                <Label>Features (one per line)</Label>
                                <FormControl>
                                    <Textarea rows={4} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                     />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding Plan...' : 'Add New Plan'}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
    );
}
