import React from 'react'
import { IoMdMail } from "react-icons/io";
import { IoCall } from "react-icons/io5";
import { FaVenusMars } from "react-icons/fa";
import { BiMaleFemale } from "react-icons/bi";
import { FaCrown } from "react-icons/fa";
import { FaGlobeAmericas } from "react-icons/fa";
import { HiOutlineNewspaper } from "react-icons/hi2";
import { useFormContext } from '@/lib/context/form-context';
import Image from 'next/image';

const Preview = () => {
    const { formData } = useFormContext();

    return (
        <div className='space-y-8 w-full'>
            <section>
                <h3 className='text-base font-semibold uppercase'>Personal Details</h3>
                <div className='flex mt-3 w-full sm:w-auto'>
                    <div className='bg-[#f5f5f5] w-full sm:w-auto py-3 px-3 sm:px-5 rounded-lg flex items-center gap-5 sm:gap-6'>
                        <div className='size-12 sm:size-14 rounded-full aspect-square bg-roze-default'></div>
                        <div>
                            <h4 className='font-medium'>{formData.fullName || 'Name'}</h4>
                            <div className='flex items-center flex-wrap gap-4 mt-2'>
                                <span className='flex items-center gap-2'>
                                    <IoMdMail />
                                    <p className='text-xs md:text-sm'>{formData.email || 'email'}</p>
                                </span>
                                <span className='flex items-center gap-2'>
                                    <IoCall />
                                    <p className='text-xs md:text-sm'>{formData.phoneNumber || 'phone'}</p>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <h3 className='text-base font-semibold uppercase'>Business Details</h3>
                <div className='mt-3 rounded-lg flex items-center gap-6'>
                    {formData.profilePicture ?
                        <div className='size-12 sm:size-14 rounded-full aspect-square border overflow-hidden'>
                            <Image height={56} width={56} src={formData.profilePicture} alt='logo' />
                        </div>
                        :
                        <div className='size-12 sm:size-14 rounded-full aspect-square bg-roze-default'></div>
                    }
                    <div>
                        <h4 className='font-medium'>{formData.brandName || 'Brand'}</h4>
                    </div>
                </div>
            </section>
            <div className='w-full border-t border-[#d8d8d8]'></div>
            <section className='grid grid-cols-2'>
                <div>
                    <span className='flex items-start gap-3'>
                        <BiMaleFemale className='text-[22px] text-roze-default' />
                        <span className='space-y-1.5'>
                            <h3 className='text-sm font-semibold uppercase'>Services For</h3>
                            <span className='flex items-center gap-1'>
                                {formData.serviceProvided.map((data, j) => (
                                    <p key={j}>
                                        {data}{j !== formData.serviceProvided.length - 1 && ", "}
                                    </p>
                                ))}
                            </span>
                        </span>
                    </span>
                </div>
                <div>
                    <span className='flex items-start gap-3'>
                        <FaVenusMars className='text-[22px] text-roze-default' />
                        <span className='space-y-1.5'>
                            <h3 className='text-sm font-semibold uppercase'>Staff</h3>
                            <span className='flex items-center gap-1'>
                                {formData.staff.map((data, j) => (
                                    <p key={j}>
                                        {data}{j !== formData.staff.length - 1 && ", "}
                                    </p>
                                ))}
                            </span>
                        </span>
                    </span>
                </div>
            </section>
            <section>
            {formData.subBusinessType.length > 0 && <div className='flex items-start gap-3'>
                    <FaGlobeAmericas className='text-[22px] text-roze-default' />
                    <div className='space-y-2'>
                        <h3 className='text-sm font-semibold uppercase'>Sub Business Type</h3>
                        <div className='flex items-center gap-2'>
                            {formData.subBusinessType.map((data, i) => (
                                <span key={i} className='p-2 min-w-20 bg-[#6b7983] text-white text-sm text-center rounded-md'>
                                    <p>{data}</p>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>}
            </section>
            <section className='space-y-8'>
                <div className='flex items-start gap-3'>
                    <FaCrown className='text-[22px] text-roze-default' />
                    <div className='space-y-1.5'>
                        <h3 className='text-sm font-semibold uppercase'>Expertise</h3>
                        <span className='flex items-center gap-1'>
                            {formData.expertise.map((data, j) => (
                                <p key={j}>
                                    {data}{j !== formData.expertise.length - 1 && ", "}
                                </p>
                            ))}
                        </span>
                    </div>
                </div>
                {formData.cityCovered.length > 0 && <div className='flex items-start gap-3'>
                    <FaGlobeAmericas className='text-[22px] text-roze-default' />
                    <div className='space-y-2'>
                        <h3 className='text-sm font-semibold uppercase'>Cities</h3>
                        <div className='flex items-center gap-2'>
                            {formData.cityCovered.map((city, i) => (
                                <span key={i} className='p-2 min-w-20 bg-[#6b7983] text-white text-sm text-center rounded-md'>
                                    <p>{city}</p>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>}
                <div className='flex items-start gap-3'>
                    <HiOutlineNewspaper className='text-[22px] text-roze-default' />
                    <div className='space-y-1.5'>
                        <h3 className='text-sm font-semibold uppercase'>Additional Information</h3>
                        <p>{formData.additionalInfo}</p>
                    </div>
                </div>
            </section>
            <div className='w-full border-t border-[#d8d8d8]'></div>
            <section className='space-y-6'>
                <h3 className='text-base font-semibold uppercase'>Business Details</h3>
                <table className='w-full table-auto'>
                    <thead className='border'>
                        <tr className='bg-[#f1f1f1]'>
                            <th className='p-3 text-sm text-left'>Package Name</th>
                            <th className='p-3 text-sm text-left'>Price</th>
                            <th className='p-3 text-sm text-left'>Services</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.packages.map((pkg) => (
                            <tr key={pkg.name} className='bg-[#fafafa]'>
                                <td className='border p-3 text-sm md:text-base'>{pkg.name}</td>
                                <td className='border p-3 text-roze-default font-semibold text-sm'>{pkg.price}</td>
                                <td className='border p-3 text-sm md:text-base'>
                                    <p>{pkg.services}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            <div className='w-full border-t border-[#d8d8d8]'></div>
            <section className='space-y-6 w-full'>
                <h3 className='text-base font-semibold uppercase'>location</h3>
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3399.9538255025095!2d74.33869589999999!3d31.552881799999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391904c8606da7e9%3A0xd70a28b88f7720d7!2sPearl%20Continental%20Hotel%2C%20Lahore!5e0!3m2!1sen!2s!4v1740224609603!5m2!1sen!2s" className='w-full' width="full" height="300" loading="lazy"></iframe>
            </section>
        </div>
    )
}

export default Preview
