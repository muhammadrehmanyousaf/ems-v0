"use client"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from "lucide-react"

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Custom Swiper styles
const swiperStyles = `
  .featured-swiper {
    padding-bottom: 60px;
  }
  
  .featured-swiper .swiper-slide {
    display: flex;
    justify-content: center;
    align-items: stretch;
    height: auto;
  }
  
  /* Ensure consistent card sizing across all breakpoints */
  .featured-swiper .swiper-slide > div {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
  }
  
  /* Ensure cards have consistent height */
  .featured-swiper .swiper-slide .w-full {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* Tablet and desktop optimizations */
  @media (min-width: 768px) {
    .featured-swiper .swiper-slide {
      padding: 0 8px;
    }
  }
  
  @media (min-width: 1024px) {
    .featured-swiper .swiper-slide {
      padding: 0 12px;
    }
  }
  
  .swiper-button-prev,
  .swiper-button-next {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(8px) !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    color: #374151 !important;
    transition: all 0.3s ease !important;
  }
  
  .swiper-button-prev:hover,
  .swiper-button-next:hover {
    background: white !important;
    transform: scale(1.05) !important;
  }
  
  .swiper-button-prev::after,
  .swiper-button-next::after {
    display: none !important;
  }
  
  .swiper-pagination {
    bottom: 0 !important;
    margin-top: 24px !important;
  }
  
  .swiper-pagination-bullet {
    background: #d1d5db !important;
    opacity: 1 !important;
    width: 8px !important;
    height: 8px !important;
    transition: all 0.3s ease !important;
  }
  
  .swiper-pagination-bullet-active {
    background: #f43f5e !important;
    transform: scale(1.25) !important;
  }
  
  @media (min-width: 768px) {
    .swiper-button-prev,
    .swiper-button-next {
      width: 48px !important;
      height: 48px !important;
    }
  }
  
  @media (min-width: 1024px) {
    .swiper-button-prev,
    .swiper-button-next {
      width: 52px !important;
      height: 52px !important;
    }
  }
`

interface FeaturedSwiperProps {
  children: React.ReactNode
  className?: string
}

export function FeaturedSwiper({ children, className = "" }: FeaturedSwiperProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: swiperStyles }} />
      <div className={`relative w-full pb-8 ${className}`}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
          }}
          breakpoints={{
            // Mobile: 1 slide centered
            320: {
              slidesPerView: 1,
              spaceBetween: 16,
              centeredSlides: true,
            },
            // Tablet: 2 slides with better spacing
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
              centeredSlides: false,
            },
            // Desktop: 3 slides
            1024: {
              slidesPerView: 3,
              spaceBetween: 24,
              centeredSlides: false,
            },
            // Large Desktop: 3 slides with more space
            1280: {
              slidesPerView: 3,
              spaceBetween: 32,
              centeredSlides: false,
            },
          }}
          className="featured-swiper"
        >
          {children}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <div className="swiper-button-prev !w-10 !h-10 md:!w-12 md:!h-12 lg:!w-14 lg:!h-14 !bg-white/90 !backdrop-blur-sm !text-gray-800 !rounded-full hover:!bg-white !shadow-lg !transition !z-50 !border !border-gray-200 !left-2 md:!left-4 lg:!left-6">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
        </div>
        <div className="swiper-button-next !w-10 !h-10 md:!w-12 md:!h-12 lg:!w-14 lg:!h-14 !bg-white/90 !backdrop-blur-sm !text-gray-800 !rounded-full hover:!bg-white !shadow-lg !transition !z-50 !border !border-gray-200 !right-2 md:!right-4 lg:!right-6">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
        </div>

        {/* Custom Pagination */}
        <div className="swiper-pagination !bottom-0 !mt-6"></div>
      </div>
    </>
  )
}

export { SwiperSlide }
