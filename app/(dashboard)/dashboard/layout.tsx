import "../../styles/dashboard-styles.css"
import React from 'react'
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import Header from '@/components/dashboard/layout/header'
import { Separator } from '@/components/ui/separator'
import ProtectedRoutes from "@/lib/protected-routes"
import { ThemeProvider } from "@/components/dashboard/layout/ThemeToggle/theme-provider"

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ProtectedRoutes>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <Header />
                        <Separator />
                        {children}
                    </SidebarInset>
                </SidebarProvider>
            </ProtectedRoutes>
        </ThemeProvider>
    )
}

export default layout
