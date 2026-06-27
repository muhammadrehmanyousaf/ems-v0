"use client"

/**
 * Images manager (redesigned, Track C — interactive). Gallery upload/remove for a
 * business (BusinessesAPI.uploadImages → multipart → append to business.images via
 * update). Used inside the business-settings hub's Images tab. Own mutations;
 * invalidates the hub's biz query so the gallery refreshes.
 */

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

export function ImagesManager({ businessId, images }: { businessId: number; images: string[] }) {
  const qc = useQueryClient()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const urls = await BusinessesAPI.uploadImages(files, businessId)
      return BusinessesAPI.update(businessId, { images: [...images, ...urls] })
    },
    onSuccess: () => { showSuccessToast("Images uploaded"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Upload failed"),
  })

  const removeMut = useMutation({
    mutationFn: (url: string) => BusinessesAPI.update(businessId, { images: images.filter((u) => u !== url) }),
    onSuccess: () => { showSuccessToast("Image removed"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove image"),
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) uploadMut.mutate(files)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Image" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Images</h2><p className="text-xs text-muted-foreground">Your public gallery — couples see these first.</p></div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" disabled={uploadMut.isPending} onClick={() => inputRef.current?.click()}>
          {uploadMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Uploading…</> : <><Icon name="Upload" size={14} className="mr-1.5" /> Upload</>}
        </Button>
      </div>

      <div className="p-4">
        {!images.length ? (
          <EmptyState icon="Image" title="No images yet" description="Upload photos of your work so couples can see what you offer." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? "Cover photo" : `Gallery image ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeMut.mutate(src)}
                  disabled={removeMut.isPending}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md bg-black/55 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 focus:opacity-100"
                >
                  <Icon name="Trash2" size={14} />
                </button>
                {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImagesManager
