import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const AdditionalInfoCard = () => {
    return (
        <Card className='col-span-2'>
            <CardHeader className='pb-3'>
                <CardTitle className='text-lg'>Additional Info</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='space-y-3'>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>City</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">Lahore</CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Address</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                123, Master street, near capital bridge, Lahore
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Google Map Link</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                https://googlelink.com
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Parking</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                Yes
                            </CardDescription>
                        </div>
                    </div>
                    <div className='space-y-3'>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Experties</Label>
                            <div className='flex items-center gap-2'>
                                <span className='text-sm py-1 px-2 rounded-md bg-primary/10 text-primary'>Wedding</span>
                                <span className='text-sm py-1 px-2 rounded-md bg-primary/10 text-primary'>Engagement</span>
                                <span className='text-sm py-1 px-2 rounded-md bg-primary/10 text-primary'>Birthday Party</span>
                            </div>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>DownPayment</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                5000
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Type of Venue</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">Marquee</CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Staff</Label>
                            <div className='flex items-center gap-2'>
                                <span className='text-sm py-1 px-2 rounded-md bg-primary/10 text-primary'>Male</span>
                                <span className='text-sm py-1 px-2 rounded-md bg-primary/10 text-primary'>Female</span>
                            </div>
                        </div>
                    </div>
                    <div className='space-y-3'>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Max People Capacity</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                500
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Catering</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                Internal
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Min Price</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                10000
                            </CardDescription>
                        </div>
                        <div className='space-y-0.5'>
                            <Label className='text-primary'>Cancellation Policy</Label>
                            <CardDescription className="text-sm text-muted-foreground text-justify">
                                Refundable
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default AdditionalInfoCard
