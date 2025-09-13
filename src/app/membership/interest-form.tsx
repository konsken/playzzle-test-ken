
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitInterestForm } from './actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});


export function InterestForm() {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);

        const result = await submitInterestForm({message: null, status: null}, formData);
        
        toast({
            title: result.status === 'success' ? 'Success!' : 'Error',
            description: result.message,
            variant: result.status === 'error' ? 'destructive' : 'default',
        });
        
        if (result.status === 'success') {
            form.reset();
        }
    });
  }

  return (
    <Card className="max-w-md mx-auto mt-12 border-primary border-2 shadow-lg">
        <CardHeader>
            <CardTitle>Be the First to Know!</CardTitle>
            <CardDescription>
                Enter your details below, and we'll send you an exclusive notification (and maybe a special offer!) when Playzzle Pro launches.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid gap-4"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                            <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Notify Me'}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
