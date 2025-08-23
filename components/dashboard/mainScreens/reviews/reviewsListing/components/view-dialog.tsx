import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { StartComponent } from './star-component';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ViewDialogProps = {
    open: boolean;
    setOpen: (v: boolean) => void;
};

function ViewDialog({ open, setOpen }: ViewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='p-5 max-w-md'>
                <DialogHeader>
                    <StartComponent value={5} dialog />
                </DialogHeader>
                <DialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                </DialogDescription>

                <DialogFooter>
                    <div className='flex items-end justify-between w-full'>
                        <div className='flex flex-1 items-center justify-start gap-2'>
                        <Avatar>
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <span>
                            <h3 className='font-[600] text-sm'>Ali Khan</h3>
                            <p className='-mt-0.5 text-[13px] text-muted-foreground'>www.alikhan.com</p>
                        </span>
                    </div>
                    <p className='text-xs text-muted-foreground'>{`14/08/2025, 06:10 pm`}</p>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ViewDialog