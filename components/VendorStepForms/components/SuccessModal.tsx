import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    message?: string,
};

const SuccessModal: React.FC<SuccessModalProps> = ({setOpen, open, message}) => {

    const router = useRouter()

    const onClick = () => {
        router.push('/login')
        setOpen(false)
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <div className="space-y-3 py-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Business Registered Successfully!</h3>
          <p className="text-muted-foreground text-sm">
            {message || "Your business has been created. Please sign in to access your dashboard and manage your profile."}
          </p>
        </div>
        <DialogFooter className='flex items-center justify-center w-full'>
          <Button type="button" variant={'default'} onClick={onClick} className='w-full'>
            Go to Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal