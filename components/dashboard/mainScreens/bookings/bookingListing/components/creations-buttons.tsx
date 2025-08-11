import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'

const CreationsButtons = () => {
    return (
        <div className='flex items-center gap-2'>
            <Button variant={'outline'} className='gap-2 hidden md:flex'>
                <Download className='size-4' />
                Export
            </Button>
            <Button className='gap-2'>
                <Plus className='size-4' />
                Add New
            </Button>
        </div>
    )
}

export default CreationsButtons
