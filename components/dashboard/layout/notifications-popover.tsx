import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const NotificationsPopover = () => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={'icon'} variant={'ghost'}>
                    <Bell className='size-4' />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount className='w-64 max-h-96'>
                <DropdownMenuLabel>
                    Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <div className='flex items-start gap-3'>
                        <Avatar className='h-9 w-9'>
                            <AvatarFallback className='bg-green-100'>A</AvatarFallback>
                        </Avatar>
                        <span>
                            <h4 className="scroll-m-20 text-[13px] font-medium tracking-tigh text-primary-foregroundt">
                                New Booking
                            </h4>
                            <p className='text-[11px] text-muted-foreground'>Ali has booked an Event todsy at 10:00 PM</p>
                        </span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem>
                    <div className='flex items-start gap-3'>
                        <Avatar className='h-9 w-9'>
                            <AvatarFallback className='bg-green-100'>A</AvatarFallback>
                        </Avatar>
                        <span>
                            <h4 className="scroll-m-20 text-[13px] font-medium tracking-tigh text-primary-foregroundt">
                                New Booking
                            </h4>
                            <p className='text-[11px] text-muted-foreground'>Ali has booked an Event todsy at 10:00 PM</p>
                        </span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem>
                    <div className='flex items-start gap-3'>
                        <Avatar className='h-9 w-9'>
                            <AvatarFallback className='bg-green-100'>A</AvatarFallback>
                        </Avatar>
                        <span>
                            <h4 className="scroll-m-20 text-[13px] font-medium tracking-tigh text-primary-foregroundt">
                                New Booking
                            </h4>
                            <p className='text-[11px] text-muted-foreground'>Ali has booked an Event todsy at 10:00 PM</p>
                        </span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default NotificationsPopover
