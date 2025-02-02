import type React from "react"
import { FormProvider } from "@/context/form-context"

export default function BusinessRegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <FormProvider>{children}</FormProvider>
}

