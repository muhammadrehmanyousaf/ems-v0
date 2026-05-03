import React from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalCrown, BridalTitle } from "@/components/bridal/bridal-card"
import { FloralDivider } from "@/components/bridal/floral-divider"

interface SuccessModalProps {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    message?: string
}

const SuccessModal: React.FC<SuccessModalProps> = ({ setOpen, open, message }) => {
    const router = useRouter()

    const onClick = () => {
        router.push("/login")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-bridal-beige bg-bridal-cream rounded-md shadow-[0_24px_60px_-32px_rgba(176,125,84,0.55)]">
                {/* Required for a11y but visually hidden — we render our own
                    Playfair italic title below. */}
                <DialogTitle className="sr-only">
                    Business registered successfully
                </DialogTitle>

                {/* Top: blush rose band with the success crest */}
                <div className="relative bg-gradient-to-b from-bridal-blush to-bridal-cream pt-9 pb-6 text-center overflow-hidden">
                    {/* Subtle floral corners — pure decoration */}
                    <span
                        aria-hidden
                        className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-bridal-rose/30 blur-2xl"
                    />
                    <span
                        aria-hidden
                        className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-bridal-gold/20 blur-2xl"
                    />

                    <div className="relative">
                        <div className="mx-auto w-16 h-16 rounded-full bg-bridal-cream border-2 border-bridal-sage/55 flex items-center justify-center shadow-[0_8px_22px_-12px_rgba(168,196,162,0.6)]">
                            <CheckCircle2
                                className="w-8 h-8 text-[#3F6B43]"
                                strokeWidth={2.2}
                            />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-7 pt-2 pb-7 text-center">
                    <BridalCrown className="mb-3">All Set</BridalCrown>
                    <BridalTitle size="h3" className="mb-3">
                        Welcome to{" "}
                        <span className="text-bridal-gold">our network</span>
                    </BridalTitle>

                    <p className="font-bridal text-bridal-text-soft text-[14px] leading-relaxed">
                        {message ||
                            "Your business has been registered. Sign in to access your dashboard and start receiving bookings."}
                    </p>

                    <FloralDivider className="my-5" width={180} />

                    <BridalButton
                        type="button"
                        variant="primary"
                        size="lg"
                        block
                        onClick={onClick}
                    >
                        Go to Sign In
                    </BridalButton>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SuccessModal
