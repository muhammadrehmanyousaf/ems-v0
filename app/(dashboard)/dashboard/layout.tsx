import "../../styles/dashboard-styles.css"
import React from 'react'
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import Header from '@/components/dashboard/layout/header'
import ProtectedRoutes from "@/lib/protected-routes"
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"
import { Metadata } from "next"
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
    title: 'EMS : Dashboard',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <main>
            <NextTopLoader color="hsl(var(--primary))" showSpinner={false} />
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {/* <ProtectedRoutes> */}
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <Header />
                        {children}
                    </SidebarInset>
                </SidebarProvider>
                {/* </ProtectedRoutes> */}
            </ThemeProvider>
        </main>
    )
}

export default layout
