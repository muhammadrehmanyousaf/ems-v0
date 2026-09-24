"use client"

/**
 * WW-MEDIA — videos manager. Sibling of ImagesManager, for `business.videos`.
 *
 * A venue is a space, and twenty stills of a hall do not tell a couple what it
 * feels like to walk into it. Vendors were already sending walkthrough clips
 * over WhatsApp because the profile had nowhere to put them; this is that place.
 *
 * Deliberately a separate component rather than a mode of ImagesManager: the
 * limits, the empty state, the accept filter and the tile (a <video> with
 * controls, not an <img>) all differ, and folding both into one component would
 * make every line read "if video … else image".
 */

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showUndoToast } from "@/lib/toast/undo"
import { toast } from "sonner"

// Mirrors the server's multer config exactly (businessRouter.js "/upload-videos":
// fileSize 60 MB, .array("videos", 5), fileFilter mimetype video/*). Keep these
// in sync — looser here means a round-trip failure, stricter means blocking an
// upload the server would have accepted.
const MAX_BYTES = 60 * 1024 * 1024
const MAX_FILES = 5

/** Same touch-reachable remove control as the images grid — see that file for why. */
const REMOVE_BTN_CLASS =
  "absolute right-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-md bg-black/55 text-white transition-opacity hover:bg-red-600 focus-visible:opacity-100 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"

/** Server/network error → something a venue owner can act on, never internals. */
function humanUploadError(e: any): string {
  const raw = String(e?.response?.data?.message ?? e?.message ?? "")
  if (/under 60 ?MB|LIMIT_FILE_SIZE/i.test(raw)) return "Each video must be under 60 MB."
  if (/Maximum 5 videos|LIMIT_FILE_COUNT/i.test(raw)) return "You can upload 5 videos at a time."
  if (/Only video files/i.test(raw)) return "Only video files can be uploaded here."
  if (/not available right now|cloudinary/i.test(raw))
    return "Video uploads are unavailable right now. Please try again shortly."
  if (/Network Error|timeout/i.test(raw))
    return "Upload failed — check your internet connection and try again."
  return "Couldn't upload those videos. Please try again."
}

export function VideosManager({ businessId, videos }: { businessId: number; videos: string[] }) {
  const qc = useQueryClient()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })

  // Same last-write-wins caveat as the images array: both mutations rewrite the
  // whole column from the prop captured at render.
  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const urls = await BusinessesAPI.uploadVideos(files, businessId)
      return BusinessesAPI.update(businessId, { videos: [...videos, ...urls] })
    },
    onSuccess: (_d, files) => {
      showSuccessToast(files.length === 1 ? "Video uploaded" : `${files.length} videos uploaded`)
      invalidate()
    },
    onError: (e: any) => toast.error(humanUploadError(e)),
  })

  // Removing only drops the URL from this business's array — the file stays in
  // Cloudinary — so it is genuinely reversible, and an Undo is the honest
  // affordance for a control that is one stray tap away from a lost clip.
  const removeMut = useMutation({
    mutationFn: (url: string) =>
      BusinessesAPI.update(businessId, { videos: videos.filter((u) => u !== url) }),
    onSuccess: () => {
      const restore = videos
      showUndoToast({
        message: "Video removed",
        onUndo: async () => {
          try {
            await BusinessesAPI.update(businessId, { videos: restore })
            invalidate()
          } catch {
            toast.error("Couldn't restore that video.")
          }
        },
      })
      invalidate()
    },
    onError: (e: any) => toast.error(humanUploadError(e)),
  })

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    // Reset first, before any early return — otherwise a rejected file stays in
    // the input and re-picking it fires no change event, so the button looks dead.
    if (inputRef.current) inputRef.current.value = ""
    if (!files.length) return

    if (files.length > MAX_FILES) {
      toast.error(`You can upload ${MAX_FILES} videos at a time — you picked ${files.length}.`)
      return
    }
    const tooBig = files.find((f) => f.size > MAX_BYTES)
    if (tooBig) {
      toast.error(
        `"${tooBig.name}" is ${(tooBig.size / 1024 / 1024).toFixed(1)} MB. Each video must be under 60 MB.`,
      )
      return
    }
    // `accept="video/*"` is only a picker hint, not enforcement — drag-drop and
    // "All files" walk straight past it.
    const notVideo = files.find((f) => !f.type.startsWith("video/"))
    if (notVideo) {
      toast.error(`"${notVideo.name}" isn't a video. Please upload an MP4 or MOV clip.`)
      return
    }

    uploadMut.mutate(files)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon name="Video" size={16} />
        </span>
        <div className="mr-auto">
          <h2 className="text-sm font-semibold">Videos</h2>
          <p className="text-xs text-muted-foreground">
            A short walkthrough shows couples what photos can&apos;t.
          </p>
        </div>
        <input ref={inputRef} type="file" accept="video/*" multiple className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" disabled={uploadMut.isPending} onClick={() => inputRef.current?.click()}>
          {uploadMut.isPending ? (
            <><Spinner size={14} className="mr-1.5" /> Uploading…</>
          ) : (
            <><Icon name="Upload" size={14} className="mr-1.5" /> Upload</>
          )}
        </Button>
      </div>

      <div className="p-4">
        {!videos.length ? (
          <EmptyState
            icon="Video"
            title="No videos yet"
            description="Upload a short clip — a walk through the hall, a setup timelapse — so couples can picture their day here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((src, i) => (
              <div key={src + i} className="group relative overflow-hidden rounded-lg border border-border bg-black">
                <video
                  src={src}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video h-full w-full object-cover"
                />
                <button
                  onClick={() => removeMut.mutate(src)}
                  disabled={removeMut.isPending}
                  aria-label="Remove video"
                  className={REMOVE_BTN_CLASS}
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default VideosManager
