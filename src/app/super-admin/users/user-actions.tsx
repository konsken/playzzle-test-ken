
'use client';

import { useState, useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserX, UserCheck, Star, ShieldBan, Crown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { deleteUser, toggleUserDisabled, toggleSuperAdmin, grantProMembership, revokeProMembership } from './actions';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


type User = {
    uid: string;
    email?: string;
    displayName?: string;
    disabled: boolean;
    isSuperAdmin: boolean;
    proTier?: string;
};

type UserActionsProps = {
    user: User;
};

type DialogState = {
    isOpen: boolean;
    type: 'delete' | 'role' | 'grant_monthly' | 'grant_yearly' | 'revoke_pro' | 'none';
};

export function UserActions({ user }: UserActionsProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, type: 'none' });

    const isPrimaryAdmin = user.email === 'kapil.webfoxtech@gmail.com';

    const handleAction = (action: () => Promise<any>, successMessage?: string) => {
        startTransition(async () => {
            const result = await action();
            if (result.success) {
                toast({ title: "Success", description: successMessage || result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
            setDialogState({ isOpen: false, type: 'none' });
        });
    };
    
    const onConfirmation = () => {
        switch (dialogState.type) {
            case 'delete':
                handleAction(() => deleteUser(user.uid));
                break;
            case 'role':
                handleAction(() => toggleSuperAdmin(user.uid, !user.isSuperAdmin));
                break;
            case 'grant_monthly':
                handleAction(() => grantProMembership(user.uid, 'monthly_pro'));
                break;
            case 'grant_yearly':
                 handleAction(() => grantProMembership(user.uid, 'yearly_pro'));
                break;
            case 'revoke_pro':
                 handleAction(() => revokeProMembership(user.uid));
                break;
        }
    };
    
    const getDialogContent = () => {
        switch(dialogState.type) {
            case 'delete':
                return { title: 'Are you absolutely sure?', description: `This action cannot be undone. This will permanently delete the user ${user.displayName || user.email} and all of their data.` };
            case 'role':
                 return { title: 'Confirm Role Change', description: `Are you sure you want to ${user.isSuperAdmin ? 'remove Super Admin privileges from' : 'grant Super Admin privileges to'} ${user.displayName || user.email}?` };
            case 'grant_monthly':
                 return { title: 'Grant Monthly Pro', description: `Are you sure you want to grant a Monthly Pro membership to ${user.displayName || user.email}?` };
            case 'grant_yearly':
                 return { title: 'Grant Yearly Pro', description: `Are you sure you want to grant a Yearly Pro membership to ${user.displayName || user.email}?` };
            case 'revoke_pro':
                 return { title: 'Revoke Pro Membership', description: `Are you sure you want to revoke the Pro membership for ${user.displayName || user.email}?` };
            default:
                return { title: '', description: '' };
        }
    }


    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                     <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => setDialogState({isOpen: true, type: 'role'})}
                            disabled={isPending || isPrimaryAdmin}
                        >
                            <Crown className="mr-2 h-4 w-4" />
                            <span>{user.isSuperAdmin ? 'Remove as Admin' : 'Make Super Admin'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleAction(() => toggleUserDisabled(user.uid, !user.disabled))}
                            disabled={isPending || isPrimaryAdmin}
                        >
                            {user.disabled ? (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    <span>Enable User</span>
                                </>
                            ) : (
                                <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    <span>Disable User</span>
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuLabel>Membership</DropdownMenuLabel>
                     <DropdownMenuGroup>
                        {!user.proTier ? (
                            <>
                                <DropdownMenuItem onClick={() => setDialogState({isOpen: true, type: 'grant_monthly'})} disabled={isPending}>
                                    <Star className="mr-2 h-4 w-4" />
                                    <span>Make Monthly Pro</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDialogState({isOpen: true, type: 'grant_yearly'})} disabled={isPending}>
                                    <Star className="mr-2 h-4 w-4" />
                                    <span>Make Yearly Pro</span>
                                </DropdownMenuItem>
                            </>
                        ) : (
                             <DropdownMenuItem onClick={() => setDialogState({isOpen: true, type: 'revoke_pro'})} disabled={isPending}>
                                <ShieldBan className="mr-2 h-4 w-4" />
                                <span>Revoke Pro</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setDialogState({isOpen: true, type: 'delete'})}
                        disabled={isPending || isPrimaryAdmin}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete User</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Confirmation Dialog */}
            <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ isOpen: false, type: 'none' })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getDialogContent().title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getDialogContent().description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onConfirmation} disabled={isPending}>
                            {isPending ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
