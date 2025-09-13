// src/components/navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, UserPlus, User, LogOut, Crown, Star, LayoutDashboard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import type { AuthenticatedUser } from '@/lib/firebase/server-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from './ui/button';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { LogoIcon } from './icons/logo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/puzzles', label: 'Puzzles' },
  { href: '/slide-puzzle', label: 'Slide Puzzle' },
  { href: '/move-puzzle', label: 'Jigsaw Puzzle' },
  { href: '/contact', label: 'Contact' },
];

type NavigationProps = {
    user: AuthenticatedUser | null;
}

export default function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const isSuperAdmin = !!user?.customClaims?.superadmin;
  
  const isPro = isSuperAdmin || (!!user?.proTier && new Date(user.proExpiry || 0) > new Date());

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  }

  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
        const names = name.trim().split(' ').filter(Boolean);
        if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
        const firstName = names[0] ?? '';
        const lastName = names.length > 1 ? names[names.length - 1] : '';
        return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };
  
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
           <div className="flex items-center gap-4">
             <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Mobile Menu</SheetTitle>
                      <SheetDescription>
                        A list of navigation links for the Playzzle application.
                      </SheetDescription>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 mt-8">
                        {navLinks.map((link) => (
                           <SheetClose asChild key={link.href}>
                             <Link
                                href={link.href}
                                className={cn(
                                    'text-lg font-medium transition-colors hover:text-primary',
                                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                                )}
                                >
                                {link.label}
                             </Link>
                           </SheetClose>
                        ))}
                         <SheetClose asChild>
                           <Link
                                href="/membership"
                                className={cn(
                                    'flex items-center gap-2 text-lg font-medium transition-colors hover:text-amber-400',
                                    pathname === '/membership' ? 'text-amber-400' : 'text-muted-foreground'
                                )}
                                >
                                <Star className="w-5 h-5 text-amber-500" />
                                Go Pro
                           </Link>
                         </SheetClose>
                    </nav>
                </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <LogoIcon className="w-8 h-8" />
                <span className="text-foreground">Playzzle</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
               <Link
                    href="/membership"
                    className={cn(
                        'flex items-center gap-1 text-sm font-medium transition-colors hover:text-amber-400',
                        pathname === '/membership' ? 'text-amber-400' : 'text-muted-foreground'
                    )}
                    >
                    <Star className="w-4 h-4 text-amber-500" />
                    Go Pro
                </Link>
            </nav>
            <ThemeToggle />
            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.picture ?? undefined} alt={user.name ?? ''} />
                                <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                            </Avatar>
                            {isSuperAdmin ? (
                                <Crown className="absolute bottom-0 right-0 w-4 h-4 fill-destructive text-destructive-foreground rounded-full bg-card p-0.5" />
                            ) : isPro && (
                                <Star className="absolute bottom-0 right-0 w-4 h-4 fill-amber-400 text-amber-500 rounded-full bg-card p-0.5" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name || user.email}</p>

                                <p className="text-xs leading-none text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         {user?.customClaims?.superadmin && (
                            <>
                                <DropdownMenuItem asChild>
                                    <Link href="/super-admin">
                                        <Crown className="mr-2 h-4 w-4" />
                                        <span>Super Admin</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href="/account">
                            <User className="mr-2 h-4 w-4" />
                            <span>Account</span>
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex items-center gap-2">
                     <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex items-center gap-2")}>
                        <LogIn className="h-4 w-4"/>
                        Login
                    </Link>
                     <Link href="/signup" className={cn(buttonVariants({ variant: "default", size: "sm" }), "hidden sm:flex items-center gap-2")}>
                        <UserPlus className="h-4 w-4"/>
                        Sign Up
                    </Link>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
