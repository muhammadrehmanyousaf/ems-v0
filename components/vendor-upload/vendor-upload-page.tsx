"use client"

// The vendor's own page: open the link the Wedding Wala team sent on WhatsApp, add photos and videos straight from the phone. No login.
// The token in the URL is the credential; the server checks every file (real type, size, safety scan) and answers a dead link with one
// plain message. Built for a phone: big touch targets, one primary action, nothing to learn.
import { useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { CheckCircle2, ImagePlus, Loader2, TriangleAlert, Video } from "lucide-react"

import { UPLOAD_REASON, vendorUploadApi, type UploadOutcome } from "@/lib/api/ops-onboarding"

export function VendorUploadPage({ token }: { token: string }) {
  const qc = useQueryClient()
  const info = useQuery({ queryKey: ["vendor-upload", token], queryFn: () => vendorUploadApi.info(token), retry: false, refetchOnWindowFocus: false })
  const [picked, setPicked] = useState<{ files: File[]; kind: "image" | "video" } | null>(null)
  const [results, setResults] = useState<UploadOutcome[]>([])
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  const send = useMutation({
    mutationFn: (p: { files: File[]; kind: "image" | "video" }) => vendorUploadApi.upload(token, p.files, p.kind),
    onSuccess: (r) => { setResults((x) => [r, ...x]); setPicked(null); qc.invalidateQueries({ queryKey: ["vendor-upload", token] }) },
  })

  const added = useMemo(() => results.reduce((n, r) => n + r.added.length, 0), [results])
  const failed = useMemo(() => results.flatMap((r) => r.failed), [results])

  const choose = (list: FileList | null, kind: "image" | "video") => {
    if (!list || !list.length) return
    setPicked({ files: Array.from(list).slice(0, 10), kind })
  }

  return (
    <div className="min-h-dvh px-4 py-8 text-[#2C1810]" style={{ background: "#FDF8F2" }}>
      {/* the cookie banner reserves space below <main>: paint the whole page, not just the content */}
      <style>{"body{background:#FDF8F2}"}</style>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#916539]">Wedding Wala</p>

        {info.isLoading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-[#7A5040]" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Opening your page…</div>
        ) : info.isError || !info.data ? (
          <section className="mt-6 rounded-2xl border border-[#EDD9C3] bg-white p-6 shadow-sm">
            <TriangleAlert className="h-6 w-6 text-[#E8917A]" aria-hidden />
            <h1 className="mt-3 text-xl font-semibold leading-tight tracking-tight">This link is not working</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#7A5040]">It may have expired or already been replaced. Please ask the Wedding Wala team to send you a new one.</p>
          </section>
        ) : (
          <>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">Add photos for {info.data.businessName}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#7A5040]">Good photos get couples to contact you. Add your best pictures of the hall, the stage, the food and the lighting.</p>

            <section className="mt-6 rounded-2xl border border-[#EDD9C3] bg-white p-5 shadow-sm" aria-label="Your gallery">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[#955E39]">Photos</dt><dd className="text-lg font-semibold tabular-nums">{info.data.images}<span className="text-sm font-normal text-[#7A5040]"> of {info.data.limits.images}</span></dd></div>
                <div><dt className="text-[#955E39]">Videos</dt><dd className="text-lg font-semibold tabular-nums">{info.data.videos}<span className="text-sm font-normal text-[#7A5040]"> of {info.data.limits.videos}</span></dd></div>
              </dl>

              <input ref={photoInput} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { choose(e.target.files, "image"); e.target.value = "" }} />
              <input ref={videoInput} type="file" hidden multiple accept="video/mp4,video/quicktime,video/webm" onChange={(e) => { choose(e.target.files, "video"); e.target.value = "" }} />

              {info.data.remainingUploads <= 0 ? (
                <p className="mt-5 rounded-xl bg-[#FFF0F3] p-3 text-sm text-[#2C1810]">You have used all the uploads this link allows. Ask the team for a new link if you have more.</p>
              ) : picked ? (
                <div className="mt-5">
                  <p className="text-sm font-medium">{picked.files.length} {picked.kind === "video" ? "video" : "photo"}{picked.files.length === 1 ? "" : "s"} selected</p>
                  <ul className="mt-2 max-h-32 overflow-auto text-xs text-[#7A5040]">{picked.files.map((f) => <li key={f.name + f.size} className="truncate">{f.name}</li>)}</ul>
                  <p className="mt-3 text-xs leading-relaxed text-[#7A5040]">By sending, you confirm these are your own photos and Wedding Wala may show them on your listing.</p>
                  <div className="mt-4 grid gap-2">
                    <button type="button" disabled={send.isPending} onClick={() => send.mutate(picked)}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C9956A] px-4 text-base font-semibold text-white transition-all duration-150 ease-out hover:bg-[#916539] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#916539] active:scale-[0.98] disabled:opacity-60">
                      {send.isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Sending…</> : "Send"}
                    </button>
                    <button type="button" disabled={send.isPending} onClick={() => setPicked(null)} className="h-11 rounded-xl border border-[#EDD9C3] bg-white text-sm font-medium transition-all duration-150 hover:bg-[#FFF9F4] active:scale-[0.98]">Choose again</button>
                  </div>
                  {send.isError ? <p role="alert" className="mt-3 text-sm text-[#B03A2E]">That did not go through. Please check your internet and try again.</p> : null}
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  <button type="button" onClick={() => photoInput.current?.click()}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#C9956A] px-4 text-base font-semibold text-white transition-all duration-150 ease-out hover:bg-[#916539] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#916539] active:scale-[0.98]">
                    <ImagePlus className="h-5 w-5" aria-hidden />Add photos
                  </button>
                  <button type="button" onClick={() => videoInput.current?.click()}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#EDD9C3] bg-white px-4 text-sm font-semibold transition-all duration-150 ease-out hover:bg-[#FFF9F4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#916539] active:scale-[0.98]">
                    <Video className="h-4 w-4" aria-hidden />Add a video
                  </button>
                </div>
              )}
            </section>

            {added > 0 ? (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-white p-4 text-sm shadow-sm" role="status"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#5E8A55]" aria-hidden /><span><strong>{added} added.</strong> Thank you. The team will review your listing.</span></p>
            ) : null}
            {failed.length ? (
              <div className="mt-4 rounded-xl border border-[#EDD9C3] bg-[#FFF9F4] p-4 text-sm" role="status">
                <p className="font-semibold">{failed.length} could not be added</p>
                <ul className="mt-2 space-y-1 text-[#7A5040]">{failed.map((f, i) => <li key={i}>{f.name ?? "A file"}: {UPLOAD_REASON[f.reason] ?? "could not be used"}</li>)}</ul>
              </div>
            ) : null}
            <p className="mt-8 text-center text-xs text-[#955E39]">This page is only for you. Please do not share the link.</p>
          </>
        )}
      </div>
    </div>
  )
}
