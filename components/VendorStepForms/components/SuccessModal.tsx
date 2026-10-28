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

/* Must match business-registration-form.tsx. The flag is what lets a successful
   registration survive a remount of the form; clear it once the vendor has
   actually seen and acted on this modal, otherwise it would re-open on every
   later visit to the registration page in the same tab. */
const REG_SUCCESS_KEY = "ww_vendor_reg_success"
const clearRegSuccess = () => {
    try { sessionStorage.removeItem(REG_SUCCESS_KEY) } catch {}
}

const SuccessModal: React.FC<SuccessModalProps> = ({ setOpen, open, message }) => {
    const router = useRouter()

    const onHomeClick = () => {
        clearRegSuccess()
        router.push("/")
        setOpen(false)
    }

    const onSignInClick = () => {
        clearRegSuccess()
        router.push("/login")
        setOpen(false)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                // Dismissing by Esc / clicking outside counts as "seen" too.
                if (!v) clearRegSuccess()
                setOpen(v)
            }}
        >
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
                                className="w-8 h-8 text-status-success"
                                strokeWidth={2.2}
                            />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-7 pt-2 pb-7 text-center">
                    <BridalCrown className="mb-3">Application Received</BridalCrown>
                    <BridalTitle size="h3" className="mb-3">
                        Submitted for{" "}
                        <span className="text-bridal-gold">Admin Review</span>
                    </BridalTitle>

                    <p className="font-bridal text-bridal-text-soft text-[14px] leading-relaxed">
                        {message ||
                            "Thank you for registering with Wedding Wala! Your business details are now in our admin review queue. Our team reviews all new registrations within 1–2 business days. You will receive an email confirmation once your account is approved, and you can then sign in."}
                    </p>

                    <FloralDivider className="my-5" width={180} />

                    <div className="space-y-3">
                        <BridalButton
                            type="button"
                            variant="primary"
                            size="lg"
                            block
                            onClick={onHomeClick}
                        >
                            Return to Homepage
                        </BridalButton>

                        <div>
                            <button
                                type="button"
                                onClick={onSignInClick}
                                className="font-bridal text-[13px] text-bridal-gold hover:text-bridal-gold-dark hover:underline transition-colors"
                            >
                                Already approved? Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SuccessModal
