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

interface SuccessModalProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
};

const SuccessModal: React.FC<SuccessModalProps> = ({setOpen, open}) => {

    const router = useRouter()

    const onClick = () => {
        router.push('/')
        setOpen(false)
    }
    
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <div className="space-y-3 py-4 text-center">
          <p>Thank You for creating your profile. It is currently under review and we will notify you once it is published</p>
        </div>
        <DialogFooter className='flex items-center justify-between w-full'>
          <Button type="submit" variant={'default'} onClick={onClick}>
            Okey
          </Button>
          <Button type="submit" variant={'outline'} onClick={onClick}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal