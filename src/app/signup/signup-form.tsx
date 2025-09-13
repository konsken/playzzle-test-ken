
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from '@/hooks/use-toast';
import { signup, signInWithGoogle } from '@/lib/firebase/auth';
import { FirebaseError } from 'firebase/app';
import { GoogleIcon } from '@/components/icons/google';
import { getSiteSettings } from '@/app/super-admin/settings/actions';

const signupFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  dob_day: z.string().min(1, "Day is required"),
  dob_month: z.string().min(1, "Month is required"),
  dob_year: z.string().min(4, "Year is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  captcha: z.string().min(1, "Please solve the math problem."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
    const day = parseInt(data.dob_day, 10);
    const month = parseInt(data.dob_month, 10);
    const year = parseInt(data.dob_year, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}, {
    message: "Please enter a valid date of birth.",
    path: ["dob_day"],
}).refine(data => {
    const year = parseInt(data.dob_year, 10);
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
}, {
    message: "Please enter a valid year.",
    path: ["dob_year"],
});


export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [offerIsEnabled, setOfferIsEnabled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    generateCaptcha();
    getSiteSettings().then(settings => {
        setOfferIsEnabled(settings.offerEnabled);
    });
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  };

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema.refine(data => parseInt(data.captcha) === num1 + num2, {
        message: "Incorrect answer. Please try again.",
        path: ["captcha"],
    })),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dob_day: "",
      dob_month: "",
      dob_year: "",
      password: "",
      confirmPassword: "",
      captcha: "",
    },
  })

  const handleSignup = async (values: z.infer<typeof signupFormSchema>) => {
    const { email, password, firstName, lastName } = values;
    startTransition(async () => {
        try {
        await signup(email, password, { firstName, lastName }, offerIsEnabled);
        toast({
            title: 'Success!',
            description: "Your account has been created. Please check your email to verify your account before logging in.",
        });
        router.push('/login');
        } catch (error) {
        console.error(error);
        let errorMessage = 'An unexpected error occurred.';
        if (error instanceof FirebaseError) {
            switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already in use.';
                break;
            case 'auth/weak-password':
                errorMessage = 'The password is too weak. It must be at least 6 characters long.';
                break;
            default:
                errorMessage = error.message;
                break;
            }
        }
        toast({
            title: 'Signup Failed',
            description: errorMessage,
            variant: 'destructive',
        });
        } finally {
            generateCaptcha();
            form.resetField("captcha");
        }
    });
  };

  const handleGoogleSignIn = async () => {
    startTransition(async () => {
        try {
        await signInWithGoogle();
        router.push('/puzzles');
        router.refresh();
        } catch (error) {
        console.error(error);
        let errorMessage = 'An unexpected error occurred during Google Sign-In.';
        if (error instanceof FirebaseError) {
            if(error.code !== 'auth/popup-closed-by-user') {
                errorMessage = error.message;
            } else {
                errorMessage = 'Google Sign-In cancelled.'
            }
        }
        toast({
            title: 'Google Sign-In Failed',
            description: errorMessage,
            variant: 'destructive',
        });
        }
    });
  }
  
  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignup)} className="grid gap-4">
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
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                     <FormField
                        control={form.control}
                        name="dob_day"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input type="number" placeholder="Day" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="dob_month"
                        render={({ field }) => (
                           <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                           </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="dob_year"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input type="number" placeholder="Year" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                </div>
                 <FormMessage>
                    {form.formState.errors.dob_day?.message || form.formState.errors.dob_year?.message}
                </FormMessage>
              </FormItem>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
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
                      <FormLabel>What is {num1} + {num2}?</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Create an account'}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
            <GoogleIcon className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

