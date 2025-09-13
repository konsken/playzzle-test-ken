
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitContactForm, type ContactFormState } from './actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  captcha: z.string().min(1, 'Please solve the math problem.'),
});

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Submitting...' : 'Submit'}
        </Button>
    );
}

export function ContactForm() {
  const { toast } = useToast();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    setIsClient(true);
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema.refine(
        (data) => parseInt(data.captcha, 10) === num1 + num2,
        {
            message: 'Incorrect answer. Please try again.',
            path: ['captcha'],
        }
    )),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      subject: '',
      message: '',
      captcha: '',
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        const result = await submitContactForm({message: null, status: null}, formData);

        toast({
            title: result.status === 'success' ? 'Success!' : 'Error',
            description: result.message,
            variant: result.status === 'error' ? 'destructive' : 'default',
        });

        if (result.status === 'success') {
            form.reset();
        }
        generateCaptcha();
        form.resetField('captcha');
    });
  };

  return (
    <Form {...form}>
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
        >
            <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                    <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                    <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>

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
            <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                    <Input placeholder="Question about a puzzle" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="Your message here..."
                    className="min-h-[120px]"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            {isClient && (
                <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>
                        What is {num1} + {num2}?
                    </FormLabel>
                    <FormControl>
                        <Input
                        type="number"
                        placeholder="Your answer"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
             <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </form>
    </Form>
  );
}
